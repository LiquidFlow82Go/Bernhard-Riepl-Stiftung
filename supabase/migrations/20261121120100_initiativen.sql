-- =====================================================================
-- Eigene Initiativen, Teil 2 von 2: Initiativförderung
--
-- - Tabelle initiativen mit Aktenzeichen IF-JJJJ-NNN (eigener Nummernkreis)
-- - Statusverlauf (Entwurf → Beschlossen → Ausgezahlt → Abgeschlossen)
-- - Dokumente in eigenem privatem Speicher-Bucket „initiativen“
--   (Pfad: <Aktenzeichen>/<Datei>)
-- - Zugriff ausschließlich Stiftungsvorstand und Admin (ist_stiftungsrat()).
--   Antragsteller sehen Initiativen nie, auch nicht über die API.
-- Voraussetzung: 20261121120000_profil_kuerzel.sql.
-- Bestehende Daten bleiben erhalten. Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------
create table if not exists public.initiativnummern (
  jahr    integer primary key,
  letzte  integer not null default 0
);

create table if not exists public.initiativen (
  id                uuid primary key default gen_random_uuid(),
  aktenzeichen      text not null unique,
  jahr              integer not null,
  datum             date not null default current_date,
  status            text not null default 'entwurf'
                    check (status in ('entwurf', 'beschlossen', 'ausgezahlt', 'abgeschlossen')),
  projekt_titel     text not null default '',
  partner_name      text not null default '',
  foerderbetrag     numeric(12, 2) check (foerderbetrag is null or foerderbetrag >= 0),
  daten             jsonb not null default '{}'::jsonb,
  erstellt_von      uuid references public.profiles (id) on delete set null,
  erstellt_am       timestamptz not null default now(),
  aktualisiert_von  uuid references public.profiles (id) on delete set null,
  aktualisiert_am   timestamptz not null default now()
);

create index if not exists initiativen_jahr_idx on public.initiativen (jahr, aktenzeichen);
create index if not exists initiativen_status_idx on public.initiativen (status);

comment on table public.initiativen is
  'Initiativförderung: vom Stiftungsvorstand selbst angelegte Förderungen (kein Antrag von außen).';

create table if not exists public.initiativ_status_verlauf (
  id             uuid primary key default gen_random_uuid(),
  initiative_id  uuid not null references public.initiativen (id) on delete cascade,
  von_status     text,
  nach_status    text not null,
  grund          text,
  geaendert_von  uuid references public.profiles (id) on delete set null,
  geaendert_am   timestamptz not null default now()
);

create index if not exists initiativ_verlauf_idx on public.initiativ_status_verlauf (initiative_id, geaendert_am);

create table if not exists public.initiativ_dokumente (
  id               uuid primary key default gen_random_uuid(),
  initiative_id    uuid not null references public.initiativen (id) on delete cascade,
  kategorie        text not null
                   check (kategorie in ('angebot', 'gemeinnuetzigkeit', 'beleg_angebot', 'beleg_rechnung', 'sonstige')),
  dateiname        text not null,
  mime_type        text not null,
  groesse          bigint not null check (groesse > 0 and groesse <= 10485760),
  speicherpfad     text not null,
  hochgeladen_von  uuid references public.profiles (id) on delete set null default auth.uid(),
  hochgeladen_am   timestamptz not null default now()
);

create index if not exists initiativ_dokumente_idx on public.initiativ_dokumente (initiative_id);

-- ---------------------------------------------------------------------
-- Änderungen protokollieren, feste Felder schützen
-- ---------------------------------------------------------------------
create or replace function public.initiative_aktualisiert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.aktenzeichen is distinct from old.aktenzeichen
     or new.jahr is distinct from old.jahr
     or new.erstellt_von is distinct from old.erstellt_von
     or new.erstellt_am is distinct from old.erstellt_am then
    raise exception 'Aktenzeichen und Anlagedaten sind unveränderlich' using errcode = '42501';
  end if;
  new.aktualisiert_am := now();
  new.aktualisiert_von := coalesce(auth.uid(), new.aktualisiert_von);
  return new;
end;
$$;

drop trigger if exists initiativen_aktualisiert on public.initiativen;
create trigger initiativen_aktualisiert
  before update on public.initiativen
  for each row execute function public.initiative_aktualisiert();

-- ---------------------------------------------------------------------
-- Anlegen mit Aktenzeichen (Nummer wird in derselben Transaktion vergeben)
-- ---------------------------------------------------------------------
create or replace function public.initiative_anlegen(p_daten jsonb, p_datum date default null)
returns public.initiativen
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_jahr  integer := extract(year from current_date)::integer;
  v_nr    integer;
  v_row   public.initiativen;
begin
  if v_uid is null or not public.ist_stiftungsrat() then
    raise exception 'Nur der Stiftungsvorstand darf Initiativen anlegen' using errcode = '42501';
  end if;

  insert into public.initiativnummern (jahr, letzte) values (v_jahr, 1)
  on conflict (jahr) do update set letzte = public.initiativnummern.letzte + 1
  returning letzte into v_nr;

  insert into public.initiativen (aktenzeichen, jahr, datum, projekt_titel, partner_name, daten, erstellt_von, aktualisiert_von)
  values (
    'IF-' || v_jahr || '-' || lpad(v_nr::text, 3, '0'),
    v_jahr,
    coalesce(p_datum, current_date),
    left(coalesce(p_daten #>> '{stammdaten,titel}', ''), 300),
    left(coalesce(p_daten #>> '{stammdaten,partnerName}', ''), 300),
    coalesce(p_daten, '{}'::jsonb),
    v_uid,
    v_uid
  )
  returning * into v_row;

  insert into public.initiativ_status_verlauf (initiative_id, von_status, nach_status, grund, geaendert_von)
  values (v_row.id, null, 'entwurf', 'Angelegt', v_uid);

  return v_row;
end;
$$;

revoke all on function public.initiative_anlegen(jsonb, date) from public, anon;
grant execute on function public.initiative_anlegen(jsonb, date) to authenticated;

-- ---------------------------------------------------------------------
-- Statuswechsel: nur serverseitig (Secret Key), nachdem die Route die
-- Vollständigkeit geprüft hat. Zurücksetzen nur mit Begründung.
-- ---------------------------------------------------------------------
create or replace function public.initiative_status_setzen(
  p_id uuid,
  p_status text,
  p_grund text,
  p_mitglied uuid
)
returns public.initiativen
language plpgsql
set search_path = ''
as $$
declare
  v_alt   text;
  v_row   public.initiativen;
  v_rang  constant text[] := array['entwurf', 'beschlossen', 'ausgezahlt', 'abgeschlossen'];
begin
  if not exists (select 1 from public.profiles where id = p_mitglied and rolle in ('stiftungsrat', 'admin')) then
    raise exception 'Nur der Stiftungsvorstand darf den Status ändern' using errcode = '42501';
  end if;
  if not (p_status = any (v_rang)) then
    raise exception 'Unbekannter Status' using errcode = '22023';
  end if;

  select status into v_alt from public.initiativen where id = p_id for update;
  if v_alt is null then
    raise exception 'Initiative nicht gefunden' using errcode = 'P0002';
  end if;
  if v_alt = p_status then
    raise exception 'Der Status ist unverändert' using errcode = '22023';
  end if;
  if array_position(v_rang, p_status) < array_position(v_rang, v_alt) and coalesce(trim(p_grund), '') = '' then
    raise exception 'Zum Zurücksetzen ist eine Begründung nötig' using errcode = '23514';
  end if;

  update public.initiativen
     set status = p_status, aktualisiert_von = p_mitglied
   where id = p_id
  returning * into v_row;

  insert into public.initiativ_status_verlauf (initiative_id, von_status, nach_status, grund, geaendert_von)
  values (p_id, v_alt, p_status, nullif(trim(p_grund), ''), p_mitglied);

  return v_row;
end;
$$;

revoke all on function public.initiative_status_setzen(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.initiative_status_setzen(uuid, text, text, uuid) to service_role;

-- ---------------------------------------------------------------------
-- Zugriffsregeln
-- ---------------------------------------------------------------------
alter table public.initiativnummern enable row level security;
alter table public.initiativen enable row level security;
alter table public.initiativ_status_verlauf enable row level security;
alter table public.initiativ_dokumente enable row level security;

revoke all on public.initiativnummern, public.initiativen, public.initiativ_status_verlauf, public.initiativ_dokumente
  from anon, authenticated;

-- Vorstand/Admin: lesen; Inhalte ändern (nicht Status, Aktenzeichen, Anlage)
grant select on public.initiativen, public.initiativ_status_verlauf, public.initiativ_dokumente to authenticated;
grant update (datum, projekt_titel, partner_name, foerderbetrag, daten) on public.initiativen to authenticated;
grant insert, delete on public.initiativ_dokumente to authenticated;
grant all on public.initiativnummern, public.initiativen, public.initiativ_status_verlauf, public.initiativ_dokumente
  to service_role;

drop policy if exists "Vorstand liest Initiativen" on public.initiativen;
create policy "Vorstand liest Initiativen" on public.initiativen
  for select to authenticated using ((select public.ist_stiftungsrat()));

drop policy if exists "Vorstand bearbeitet Initiativen" on public.initiativen;
create policy "Vorstand bearbeitet Initiativen" on public.initiativen
  for update to authenticated
  using ((select public.ist_stiftungsrat()))
  with check ((select public.ist_stiftungsrat()));

drop policy if exists "Vorstand liest Statusverlauf" on public.initiativ_status_verlauf;
create policy "Vorstand liest Statusverlauf" on public.initiativ_status_verlauf
  for select to authenticated using ((select public.ist_stiftungsrat()));

drop policy if exists "Vorstand liest Initiativ-Dokumente" on public.initiativ_dokumente;
create policy "Vorstand liest Initiativ-Dokumente" on public.initiativ_dokumente
  for select to authenticated using ((select public.ist_stiftungsrat()));

drop policy if exists "Vorstand fügt Initiativ-Dokumente hinzu" on public.initiativ_dokumente;
create policy "Vorstand fügt Initiativ-Dokumente hinzu" on public.initiativ_dokumente
  for insert to authenticated
  with check (
    (select public.ist_stiftungsrat())
    and hochgeladen_von = (select auth.uid())
    and exists (select 1 from public.initiativen i where i.id = initiative_id and i.status <> 'abgeschlossen')
  );

-- Dateien nur entfernen, solange die Initiative ein Entwurf ist
drop policy if exists "Vorstand entfernt Dokumente im Entwurf" on public.initiativ_dokumente;
create policy "Vorstand entfernt Dokumente im Entwurf" on public.initiativ_dokumente
  for delete to authenticated
  using (
    (select public.ist_stiftungsrat())
    and exists (select 1 from public.initiativen i where i.id = initiative_id and i.status = 'entwurf')
  );

-- ---------------------------------------------------------------------
-- Speicher: eigener privater Bucket, Pfad <Aktenzeichen>/<Datei>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('initiativen', 'initiativen', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Initiativ-Dateien lesen" on storage.objects;
create policy "Initiativ-Dateien lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'initiativen' and (select public.ist_stiftungsrat()));

drop policy if exists "Initiativ-Dateien hochladen" on storage.objects;
create policy "Initiativ-Dateien hochladen" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'initiativen'
    and (select public.ist_stiftungsrat())
    and exists (
      select 1 from public.initiativen i
      where i.aktenzeichen = (storage.foldername(name))[1] and i.status <> 'abgeschlossen'
    )
  );

drop policy if exists "Initiativ-Dateien im Entwurf entfernen" on storage.objects;
create policy "Initiativ-Dateien im Entwurf entfernen" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'initiativen'
    and (select public.ist_stiftungsrat())
    and exists (
      select 1 from public.initiativen i
      where i.aktenzeichen = (storage.foldername(name))[1] and i.status = 'entwurf'
    )
  );
