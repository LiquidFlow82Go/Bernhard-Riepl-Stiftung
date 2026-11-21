-- =====================================================================
-- Eigene Initiativen, Teil 1 von 2: Kürzel für Vorstandsmitglieder
--
-- Neue Spalte profiles.kuerzel (z. B. „FS“). Wird aus den Initialen des
-- Namens vorbelegt, solange sie leer ist, und lässt sich im Table Editor
-- ändern. Verwendet im Abschlussvermerk der Initiativförderung.
-- Bestehende Daten bleiben erhalten. Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

alter table public.profiles add column if not exists kuerzel text not null default '';

-- Initialen aus einem Namen, höchstens vier Buchstaben: „Florian Schachlitz“ → „FS“
create or replace function public.initialen(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(upper(coalesce(string_agg(left(w, 1), '' order by nr), '')), 4)
  from regexp_split_to_table(trim(coalesce(p_name, '')), '\s+') with ordinality as t(w, nr)
  where w <> '' and w !~* '^(dr|prof|von|van|de)\.?$';
$$;

create or replace function public.kuerzel_vorbelegen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(new.kuerzel, '') = '' then
    new.kuerzel := public.initialen(new.name);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_kuerzel on public.profiles;
create trigger profiles_kuerzel
  before insert or update of name, kuerzel on public.profiles
  for each row execute function public.kuerzel_vorbelegen();

-- Bestehende Profile vorbelegen
update public.profiles set kuerzel = public.initialen(name) where kuerzel = '' and name <> '';
