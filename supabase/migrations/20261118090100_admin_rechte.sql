-- =====================================================================
-- Verbesserungen 2026-11, Punkt 6 (Teil 2 von 2): Rechte der Rolle „admin“
--
-- Admins dürfen alles, was der Stiftungsrat darf (Bereich, Absage,
-- Bewilligung, alle Anträge lesen). Anträge einreichen dürfen sie nicht.
-- Voraussetzung: 20261118090000_admin_rolle_wert.sql wurde ausgeführt.
-- Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

-- Alle bestehenden Zugriffsregeln nutzen ist_stiftungsrat(); damit gelten
-- sie automatisch auch für Admins.
create or replace function public.ist_stiftungsrat()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and rolle in ('stiftungsrat', 'admin')
  );
$$;

create or replace function public.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and rolle = 'admin'
  );
$$;

revoke all on function public.ist_admin() from public, anon;
grant execute on function public.ist_admin() to authenticated;

-- Absage: Ratsmitglied oder Admin
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
  if not exists (select 1 from public.profiles where id = p_ratsmitglied and rolle in ('stiftungsrat', 'admin')) then
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
