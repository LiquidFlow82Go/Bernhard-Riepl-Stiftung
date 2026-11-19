-- Ein registriertes Konto zum Stiftungsvorstand machen.
-- Ausführen im Supabase SQL Editor; E-Mail-Adresse anpassen.
update public.profiles
set rolle = 'stiftungsrat'
where email = 'name@beispiel.de';

-- Kontrolle:
select email, name, rolle from public.profiles order by rolle, email;
