-- =====================================================================
-- Bernhard Riepl Stiftung – Phase 2: Grundschema
-- Tabellen, Zugriffsregeln (RLS), Funktionen und Dokumentenspeicher.
--
-- Ausführen: Supabase Dashboard → SQL Editor → Inhalt einfügen → Run.
-- Die Migration kann gefahrlos erneut ausgeführt werden (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Typen
-- ---------------------------------------------------------------------
do $$ begin
  create type public.rolle as enum ('antragsteller', 'stiftungsrat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.antrag_status as enum ('eingegangen', 'in_pruefung', 'bewilligt', 'abgelehnt');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Profile (1:1 zu auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  name         text not null default '',
  institution  text not null default '',
  rolle        public.rolle not null default 'antragsteller',
  erstellt_am  timestamptz not null default now()
);

comment on table public.profiles is 'Benutzerprofil mit Rolle. Die Rolle Stiftungsrat wird nur per SQL vergeben.';

-- Neues Profil bei jeder Registrierung. Die Rolle ist immer „antragsteller“,
-- egal was der Client in den Metadaten mitschickt.
create or replace function public.neues_profil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, institution)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'institution', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists bei_registrierung on auth.users;
create trigger bei_registrierung
  after insert on auth.users
  for each row execute function public.neues_profil();

-- Hilfsfunktion für Zugriffsregeln (security definer verhindert Rekursion)
create or replace function public.ist_stiftungsrat()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and rolle = 'stiftungsrat'
  );
$$;

-- ---------------------------------------------------------------------
-- Anträge
-- ---------------------------------------------------------------------
create table if not exists public.antraege (
  id                  uuid primary key default gen_random_uuid(),
  nummer              text not null unique check (nummer ~ '^\d{4}-\d{3,}$'),
  benutzer_id         uuid not null references public.profiles (id) on delete restrict,
  eingereicht_am      timestamptz not null default now(),
  aktualisiert_am     timestamptz not null default now(),
  status              public.antrag_status not null default 'eingegangen',
  betrag_beantragt    numeric(12, 2) not null check (betrag_beantragt > 0),
  bewilligter_betrag  numeric(12, 2) check (bewilligter_betrag is null or bewilligter_betrag >= 0),
  daten               jsonb not null,
  -- für Suche und Tabellen, aus den Formulardaten abgeleitet
  antragsteller_name  text generated always as (daten -> 'antragsteller' ->> 'name') stored,
  projekt_titel       text generated always as (daten -> 'projekt' ->> 'titel') stored
);

create index if not exists antraege_benutzer_idx on public.antraege (benutzer_id);
create index if not exists antraege_eingang_idx on public.antraege (eingereicht_am desc);

-- Laufende Nummer je Jahr
create table if not exists public.antragsnummern (
  jahr    integer primary key,
  letzte  integer not null default 0
);

create or replace function public.setze_aktualisiert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.aktualisiert_am := now();
  return new;
end;
$$;

drop trigger if exists antraege_aktualisiert on public.antraege;
create trigger antraege_aktualisiert
  before update on public.antraege
  for each row execute function public.setze_aktualisiert();

-- ---------------------------------------------------------------------
-- Dokumente (Metadaten; die Dateien liegen im Storage-Bucket)
-- ---------------------------------------------------------------------
create table if not exists public.dokumente (
  id              uuid primary key default gen_random_uuid(),
  antrag_id       uuid not null references public.antraege (id) on delete cascade,
  kategorie       text not null check (kategorie in ('freistellung', 'satzung', 'vereinsregister', 'gemeinnuetzigkeit', 'weitere')),
  dateiname       text not null,
  mime_type       text not null,
  groesse         bigint not null check (groesse > 0 and groesse <= 10485760),
  speicherpfad    text not null unique,
  hochgeladen_am  timestamptz not null default now()
);

create index if not exists dokumente_antrag_idx on public.dokumente (antrag_id);

-- ---------------------------------------------------------------------
-- Absagen (Verlauf; die jüngste gehört zum Status „abgelehnt“)
-- ---------------------------------------------------------------------
create table if not exists public.absagen (
  id           uuid primary key default gen_random_uuid(),
  antrag_id    uuid not null references public.antraege (id) on delete cascade,
  grund_id     text not null,
  grund_titel  text not null,
  betreff      text not null,
  text         text not null,
  empfaenger   text not null,
  datum        timestamptz not null default now(),
  erstellt_von uuid references public.profiles (id) on delete set null,
  -- Phase 4: Zeitpunkt des echten E-Mail-Versands
  versendet_am timestamptz
);

create index if not exists absagen_antrag_idx on public.absagen (antrag_id, datum desc);

-- ---------------------------------------------------------------------
-- Funktionen (RPC)
-- ---------------------------------------------------------------------

-- Reicht einen Antrag ein: prüft Pflichtangaben, vergibt die Nummer
-- JJJJ-NNN ohne Doppelvergabe und legt den Antrag an.
create or replace function public.antrag_einreichen(p_daten jsonb, p_betrag_beantragt numeric)
returns public.antraege
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_jahr   integer := extract(year from now() at time zone 'Europe/Berlin')::integer;
  v_lfd    integer;
  v_antrag public.antraege;
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and rolle = 'antragsteller') then
    raise exception 'Nur Antragsteller können Anträge einreichen' using errcode = '42501';
  end if;
  if coalesce(trim(p_daten -> 'antragsteller' ->> 'name'), '') = ''
     or coalesce(trim(p_daten -> 'antragsteller' ->> 'email'), '') = ''
     or coalesce(trim(p_daten -> 'projekt' ->> 'titel'), '') = '' then
    raise exception 'Pflichtangaben fehlen (Name, E-Mail, Projekttitel)' using errcode = '23514';
  end if;
  if coalesce((p_daten ->> 'bestaetigung')::boolean, false) is not true
     or coalesce((p_daten ->> 'datenschutz')::boolean, false) is not true then
    raise exception 'Bestätigung und Datenschutzhinweis fehlen' using errcode = '23514';
  end if;
  if p_betrag_beantragt is null or p_betrag_beantragt <= 0 then
    raise exception 'Die beantragte Förderung muss größer 0 sein' using errcode = '23514';
  end if;

  insert into public.antragsnummern (jahr, letzte) values (v_jahr, 1)
  on conflict (jahr) do update set letzte = public.antragsnummern.letzte + 1
  returning letzte into v_lfd;

  insert into public.antraege (nummer, benutzer_id, betrag_beantragt, daten)
  values (v_jahr || '-' || lpad(v_lfd::text, 3, '0'), v_uid, p_betrag_beantragt, p_daten)
  returning * into v_antrag;

  return v_antrag;
end;
$$;

-- Lehnt einen Antrag ab und hält Grund, Text und Datum fest (nur Stiftungsrat).
create or replace function public.antrag_ablehnen(
  p_antrag_id uuid,
  p_grund_id text,
  p_grund_titel text,
  p_betreff text,
  p_text text,
  p_empfaenger text
)
returns public.antraege
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antrag public.antraege;
begin
  if not public.ist_stiftungsrat() then
    raise exception 'Nur der Stiftungsrat darf Anträge ablehnen' using errcode = '42501';
  end if;

  insert into public.absagen (antrag_id, grund_id, grund_titel, betreff, text, empfaenger, erstellt_von)
  values (p_antrag_id, p_grund_id, p_grund_titel, p_betreff, p_text, p_empfaenger, auth.uid());

  update public.antraege set status = 'abgelehnt'
  where id = p_antrag_id
  returning * into v_antrag;

  if v_antrag.id is null then
    raise exception 'Antrag nicht gefunden' using errcode = 'P0002';
  end if;
  return v_antrag;
end;
$$;

revoke all on function public.antrag_einreichen(jsonb, numeric) from public, anon;
revoke all on function public.antrag_ablehnen(uuid, text, text, text, text, text) from public, anon;
revoke all on function public.ist_stiftungsrat() from public, anon;
revoke all on function public.neues_profil() from public, anon, authenticated;
grant execute on function public.antrag_einreichen(jsonb, numeric) to authenticated;
grant execute on function public.antrag_ablehnen(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.ist_stiftungsrat() to authenticated;

-- ---------------------------------------------------------------------
-- Rechte und Zugriffsregeln (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.antraege       enable row level security;
alter table public.antragsnummern enable row level security;
alter table public.dokumente      enable row level security;
alter table public.absagen        enable row level security;

-- Nicht angemeldete Besucher haben keinerlei Tabellenzugriff.
revoke all on public.profiles, public.antraege, public.antragsnummern, public.dokumente, public.absagen from anon;

-- Angemeldete Benutzer: nur das, was die Oberfläche braucht.
revoke all on public.profiles, public.antraege, public.antragsnummern, public.dokumente, public.absagen from authenticated;
grant select on public.profiles to authenticated;
grant select on public.antraege to authenticated;
grant update (status, bewilligter_betrag) on public.antraege to authenticated;
grant select, insert on public.dokumente to authenticated;
grant select on public.absagen to authenticated;
-- antragsnummern: kein direkter Zugriff, nur über antrag_einreichen()

-- profiles
drop policy if exists "Eigenes Profil oder Stiftungsrat lesen" on public.profiles;
create policy "Eigenes Profil oder Stiftungsrat lesen" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.ist_stiftungsrat()));

-- antraege
drop policy if exists "Eigene Anträge oder Stiftungsrat lesen" on public.antraege;
create policy "Eigene Anträge oder Stiftungsrat lesen" on public.antraege
  for select to authenticated
  using (benutzer_id = (select auth.uid()) or (select public.ist_stiftungsrat()));

drop policy if exists "Stiftungsrat ändert Status und Betrag" on public.antraege;
create policy "Stiftungsrat ändert Status und Betrag" on public.antraege
  for update to authenticated
  using ((select public.ist_stiftungsrat()))
  with check ((select public.ist_stiftungsrat()));

-- dokumente
drop policy if exists "Dokumente eigener Anträge oder Stiftungsrat lesen" on public.dokumente;
create policy "Dokumente eigener Anträge oder Stiftungsrat lesen" on public.dokumente
  for select to authenticated
  using (
    (select public.ist_stiftungsrat())
    or exists (select 1 from public.antraege a where a.id = antrag_id and a.benutzer_id = (select auth.uid()))
  );

drop policy if exists "Dokumente zum eigenen, neuen Antrag hinzufügen" on public.dokumente;
create policy "Dokumente zum eigenen, neuen Antrag hinzufügen" on public.dokumente
  for insert to authenticated
  with check (
    exists (
      select 1 from public.antraege a
      where a.id = antrag_id
        and a.benutzer_id = (select auth.uid())
        and a.status = 'eingegangen'
    )
  );

-- absagen
drop policy if exists "Absagen eigener Anträge oder Stiftungsrat lesen" on public.absagen;
create policy "Absagen eigener Anträge oder Stiftungsrat lesen" on public.absagen
  for select to authenticated
  using (
    (select public.ist_stiftungsrat())
    or exists (select 1 from public.antraege a where a.id = antrag_id and a.benutzer_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------
-- Dokumentenspeicher (privater Bucket, Pfad: <antrag_id>/<datei>)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('antragsdokumente', 'antragsdokumente', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Antragsdokumente hochladen" on storage.objects;
create policy "Antragsdokumente hochladen" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'antragsdokumente'
    and exists (
      select 1 from public.antraege a
      where a.id::text = (storage.foldername(name))[1]
        and a.benutzer_id = (select auth.uid())
        and a.status = 'eingegangen'
    )
  );

drop policy if exists "Antragsdokumente lesen" on storage.objects;
create policy "Antragsdokumente lesen" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'antragsdokumente'
    and (
      (select public.ist_stiftungsrat())
      or exists (
        select 1 from public.antraege a
        where a.id::text = (storage.foldername(name))[1]
          and a.benutzer_id = (select auth.uid())
      )
    )
  );
