-- =====================================================================
-- Verbesserungen 2026-11, Punkt 7: Bewilligung mit vorgefertigter E-Mail
--
-- - Tabelle bewilligungen (Betrag, gesendeter Text, Datum, Ratsmitglied)
-- - bewilligung_speichern(): nur serverseitig (Secret Key), nach dem
--   Versand bzw. bei „Nur bewilligen“
-- - „Bewilligt“ und „Abgelehnt“ setzt nur noch der Server
-- Bestehende Daten bleiben erhalten. Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

create table if not exists public.bewilligungen (
  id             uuid primary key default gen_random_uuid(),
  antrag_id      uuid not null references public.antraege (id) on delete cascade,
  betrag         numeric(12, 2) not null check (betrag > 0),
  mail_gesendet  boolean not null,
  betreff        text,
  text           text,
  empfaenger     text,
  erstellt_von   uuid references public.profiles (id) on delete set null,
  datum          timestamptz not null default now()
);

create index if not exists bewilligungen_antrag_idx on public.bewilligungen (antrag_id, datum desc);

alter table public.bewilligungen enable row level security;
revoke all on public.bewilligungen from anon, authenticated;
grant select on public.bewilligungen to authenticated;
grant select, insert on public.bewilligungen to service_role;

drop policy if exists "Bewilligungen eigener Anträge oder Stiftungsrat lesen" on public.bewilligungen;
create policy "Bewilligungen eigener Anträge oder Stiftungsrat lesen" on public.bewilligungen
  for select to authenticated
  using (
    (select public.ist_stiftungsrat())
    or exists (select 1 from public.antraege a where a.id = antrag_id and a.benutzer_id = (select auth.uid()))
  );

create or replace function public.bewilligung_speichern(
  p_antrag_id uuid,
  p_betrag numeric,
  p_mail_gesendet boolean,
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
  if not exists (select 1 from public.profiles where id = p_ratsmitglied and rolle in ('stiftungsrat', 'admin')) then
    raise exception 'Nur der Stiftungsrat darf Anträge bewilligen' using errcode = '42501';
  end if;
  if p_betrag is null or p_betrag <= 0 then
    raise exception 'Der bewilligte Betrag muss größer 0 sein' using errcode = '23514';
  end if;

  insert into public.bewilligungen (antrag_id, betrag, mail_gesendet, betreff, text, empfaenger, erstellt_von)
  values (p_antrag_id, p_betrag, p_mail_gesendet, p_betreff, p_text, p_empfaenger, p_ratsmitglied);

  update public.antraege set status = 'bewilligt', bewilligter_betrag = p_betrag
  where id = p_antrag_id
  returning * into v_antrag;

  if v_antrag.id is null then
    raise exception 'Antrag nicht gefunden' using errcode = 'P0002';
  end if;
  return v_antrag;
end;
$$;

revoke all on function public.bewilligung_speichern(uuid, numeric, boolean, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.bewilligung_speichern(uuid, numeric, boolean, text, text, text, uuid) to service_role;

-- „Bewilligt“ und „Abgelehnt“ nur serverseitig (nach Dialog bzw. Versand)
create or replace function public.pruefe_ablehnung()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('abgelehnt', 'bewilligt')
     and old.status is distinct from new.status
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'Die Status „Bewilligt“ und „Abgelehnt“ werden nur über den jeweiligen Dialog gesetzt' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Den bewilligten Betrag ändert nur noch bewilligung_speichern()
revoke update (bewilligter_betrag) on public.antraege from authenticated;
