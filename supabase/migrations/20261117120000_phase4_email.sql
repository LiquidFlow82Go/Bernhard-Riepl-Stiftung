-- =====================================================================
-- Bernhard Riepl Stiftung – Phase 4: E-Mail-Versand
-- Protokoll der versendeten E-Mails und Absage nur nach erfolgreichem Versand.
--
-- Ausführen: Supabase Dashboard → SQL Editor → Inhalt einfügen → Run.
-- Voraussetzung: Migration 20261115120000_phase2_grundschema.sql.
-- Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Protokoll (ohne Mailtext)
-- ---------------------------------------------------------------------
create table if not exists public.mail_log (
  id              uuid primary key default gen_random_uuid(),
  antrag_id       uuid references public.antraege (id) on delete cascade,
  art             text not null check (art in ('eingang_antragsteller', 'eingang_stiftungsrat', 'absage')),
  empfaenger      text not null,
  zeitpunkt       timestamptz not null default now(),
  erfolgreich     boolean not null,
  fehler          text,
  ausgeloest_von  uuid references public.profiles (id) on delete set null
);

create index if not exists mail_log_antrag_idx on public.mail_log (antrag_id, art, zeitpunkt desc);

comment on table public.mail_log is 'Protokoll aller E-Mails der Webseite (ohne Inhalt). Schreiben nur serverseitig.';

alter table public.mail_log enable row level security;

revoke all on public.mail_log from anon, authenticated;
grant select on public.mail_log to authenticated;
grant select, insert on public.mail_log to service_role;

drop policy if exists "Stiftungsrat liest Mailprotokoll" on public.mail_log;
create policy "Stiftungsrat liest Mailprotokoll" on public.mail_log
  for select to authenticated
  using ((select public.ist_stiftungsrat()));

-- ---------------------------------------------------------------------
-- Absage: nur noch serverseitig nach erfolgreichem Versand
-- ---------------------------------------------------------------------

-- Die bisherige Funktion konnte der Stiftungsrat direkt aufrufen – auch ohne
-- E-Mail. Sie wird durch absage_speichern() ersetzt, die nur der Server
-- (Secret Key) nach erfolgreichem Versand aufruft.
drop function if exists public.antrag_ablehnen(uuid, text, text, text, text, text);

create or replace function public.absage_speichern(
  p_antrag_id uuid,
  p_grund_id text,
  p_grund_titel text,
  p_betreff text,
  p_text text,
  p_empfaenger text,
  p_ratsmitglied uuid
)
returns public.antraege
language plpgsql
set search_path = ''
as $$
declare
  v_antrag public.antraege;
begin
  if not exists (select 1 from public.profiles where id = p_ratsmitglied and rolle = 'stiftungsrat') then
    raise exception 'Nur der Stiftungsrat darf Anträge ablehnen' using errcode = '42501';
  end if;

  insert into public.absagen (antrag_id, grund_id, grund_titel, betreff, text, empfaenger, erstellt_von, versendet_am)
  values (p_antrag_id, p_grund_id, p_grund_titel, p_betreff, p_text, p_empfaenger, p_ratsmitglied, now());

  update public.antraege set status = 'abgelehnt'
  where id = p_antrag_id
  returning * into v_antrag;

  if v_antrag.id is null then
    raise exception 'Antrag nicht gefunden' using errcode = 'P0002';
  end if;
  return v_antrag;
end;
$$;

revoke all on function public.absage_speichern(uuid, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.absage_speichern(uuid, text, text, text, text, text, uuid) to service_role;

-- „Abgelehnt“ darf nur der Server setzen (also nach dem Versand der Absage).
-- Über die Oberfläche bleiben Eingegangen, In Prüfung und Bewilligt frei wählbar.
create or replace function public.pruefe_ablehnung()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'abgelehnt'
     and old.status is distinct from 'abgelehnt'
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'Der Status „Abgelehnt“ wird nur beim Versand einer Absage gesetzt' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists antraege_ablehnung_pruefen on public.antraege;
create trigger antraege_ablehnung_pruefen
  before update of status on public.antraege
  for each row execute function public.pruefe_ablehnung();

-- Der Server liest Profile (Empfängeradresse) und Anträge mit dem Secret Key.
grant select on public.profiles, public.antraege, public.absagen to service_role;
