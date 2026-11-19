-- #####################################################################
-- ##                                                                 ##
-- ##   MANUELL AUSFÜHREN – NUR VOR DEM GO-LIVE – NICHT AUTOMATISCH    ##
-- ##                                                                 ##
-- #####################################################################
--
-- Entfernt die beiden Testkonten mit allem, was daran hängt:
--   antrag@test.de  (Antragsteller)
--   rat@test.de     (Stiftungsvorstand)
--
-- Gelöscht werden: Anträge der Testkonten samt Dokument-Einträgen,
-- Absagen, Bewilligungen und Mailprotokoll; danach die Konten selbst
-- (auth.users → profiles per Kaskade).
--
-- Diese Datei wird NICHT automatisch angewendet: Der Dateiname beginnt
-- bewusst nicht mit einem Zeitstempel, deshalb überspringt die Supabase
-- CLI sie. Bitte nur im Supabase SQL Editor und nur abschnittsweise
-- ausführen.
--
-- Ablauf:
--   Schritt 1  Vorschau ausführen und Ergebnis prüfen
--   Schritt 2  Dateien im Storage löschen (Dashboard)
--   Schritt 3  Löschen ausführen – endet zur Sicherheit mit ROLLBACK;
--              erst wenn die Zahlen stimmen, ROLLBACK durch COMMIT ersetzen
--   Schritt 4  Kontrolle
-- =====================================================================


-- =====================================================================
-- Schritt 1: VORSCHAU – ändert nichts
-- =====================================================================

-- Betroffene Konten
select id, email, name, rolle, erstellt_am
from public.profiles
where email in ('antrag@test.de', 'rat@test.de');

-- Betroffene Anträge (die ID ist zugleich der Ordnername im Storage)
select a.id as storage_ordner, a.nummer, a.status, a.projekt_titel, p.email
from public.antraege a
join public.profiles p on p.id = a.benutzer_id
where p.email in ('antrag@test.de', 'rat@test.de')
order by a.nummer;

-- Anzahl je Tabelle
select 'antraege' as tabelle, count(*) from public.antraege a
  join public.profiles p on p.id = a.benutzer_id where p.email in ('antrag@test.de', 'rat@test.de')
union all
select 'dokumente', count(*) from public.dokumente d
  join public.antraege a on a.id = d.antrag_id
  join public.profiles p on p.id = a.benutzer_id where p.email in ('antrag@test.de', 'rat@test.de')
union all
select 'absagen', count(*) from public.absagen x
  join public.antraege a on a.id = x.antrag_id
  join public.profiles p on p.id = a.benutzer_id where p.email in ('antrag@test.de', 'rat@test.de')
union all
select 'bewilligungen', count(*) from public.bewilligungen x
  join public.antraege a on a.id = x.antrag_id
  join public.profiles p on p.id = a.benutzer_id where p.email in ('antrag@test.de', 'rat@test.de')
union all
select 'mail_log', count(*) from public.mail_log m
  where m.antrag_id in (select a.id from public.antraege a join public.profiles p on p.id = a.benutzer_id
                        where p.email in ('antrag@test.de', 'rat@test.de'))
     or m.ausgeloest_von in (select id from public.profiles where email in ('antrag@test.de', 'rat@test.de'))
union all
select 'storage-dateien', count(*) from storage.objects o
  where o.bucket_id = 'antragsdokumente'
    and (storage.foldername(o.name))[1] in (
      select a.id::text from public.antraege a join public.profiles p on p.id = a.benutzer_id
      where p.email in ('antrag@test.de', 'rat@test.de'));

-- Gibt es Anträge ANDERER Konten? Dann vor dem Go-live klären, ob auch
-- diese Testdaten sind. Dieses Skript lässt sie unangetastet.
select a.nummer, p.email, a.status
from public.antraege a
join public.profiles p on p.id = a.benutzer_id
where p.email not in ('antrag@test.de', 'rat@test.de');


-- =====================================================================
-- Schritt 2: DATEIEN IM STORAGE LÖSCHEN (im Dashboard, nicht per SQL)
-- =====================================================================
-- Supabase erlaubt das Löschen von Storage-Dateien nicht direkt per SQL.
-- Storage → Bucket „antragsdokumente“ → die Ordner aus der Spalte
-- „storage_ordner“ der Vorschau markieren → Delete.
-- Diesen Schritt VOR Schritt 3 erledigen, solange die Ordnerliste noch
-- abgefragt werden kann.


-- =====================================================================
-- Schritt 3: LÖSCHEN – zuerst mit ROLLBACK ausführen und Zahlen prüfen
-- =====================================================================
begin;

-- Mailprotokoll der Test-Anträge und von Testkonten ausgelöste Einträge
delete from public.mail_log
where antrag_id in (select a.id from public.antraege a join public.profiles p on p.id = a.benutzer_id
                    where p.email in ('antrag@test.de', 'rat@test.de'))
   or ausgeloest_von in (select id from public.profiles where email in ('antrag@test.de', 'rat@test.de'));

-- Anträge der Testkonten; dokumente, absagen und bewilligungen folgen per Kaskade
delete from public.antraege
where benutzer_id in (select id from public.profiles where email in ('antrag@test.de', 'rat@test.de'));

-- Konten; profiles folgt per Kaskade
delete from auth.users
where email in ('antrag@test.de', 'rat@test.de');

-- Kontrolle innerhalb der Transaktion: alle Werte müssen 0 sein
select
  (select count(*) from public.profiles where email in ('antrag@test.de', 'rat@test.de')) as profile,
  (select count(*) from auth.users      where email in ('antrag@test.de', 'rat@test.de')) as konten;

-- Zur Sicherheit wird hier zurückgerollt. Wenn Vorschau und Kontrolle
-- stimmen, „rollback;“ durch „commit;“ ersetzen und Schritt 3 erneut ausführen.
rollback;


-- =====================================================================
-- Schritt 4: KONTROLLE nach dem COMMIT
-- =====================================================================
select email, rolle from public.profiles order by email;
select nummer, status from public.antraege order by nummer;

-- Optional: Antragsnummern wieder bei 001 beginnen lassen. Nur ausführen,
-- wenn danach KEIN Antrag des laufenden Jahres mehr existiert.
-- delete from public.antragsnummern where jahr = extract(year from now())::int;
