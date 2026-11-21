-- =====================================================================
-- Eigene Initiativen – Nachtrag, Punkt 2: Steuerbegünstigung und Einzelfallhilfe
--
-- - Dokumente: neue Kategorie „beduerftigkeit“ (Nachweise der Bedürftigkeit)
--   und Spalte nachweis_art (Art des Nachweises)
-- - Formulardaten: früheres Freitextfeld „Gemeinnützigkeit des Partners“
--   wird nach „Ergänzende Hinweise“ übernommen, damit nichts verloren geht
-- Zugriff bleibt unverändert: nur Stiftungsvorstand und Admin (RLS der
-- Tabelle initiativ_dokumente und des Buckets „initiativen“).
-- Voraussetzung: 20261121130000_initiativen_empfaenger.sql.
-- Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

alter table public.initiativ_dokumente add column if not exists nachweis_art text;

alter table public.initiativ_dokumente drop constraint if exists initiativ_dokumente_kategorie_check;
alter table public.initiativ_dokumente add constraint initiativ_dokumente_kategorie_check
  check (kategorie in ('angebot', 'gemeinnuetzigkeit', 'beduerftigkeit', 'beleg_angebot', 'beleg_rechnung', 'sonstige'));

alter table public.initiativ_dokumente drop constraint if exists initiativ_dokumente_nachweis_art_check;
alter table public.initiativ_dokumente add constraint initiativ_dokumente_nachweis_art_check
  check (
    nachweis_art is null
    or nachweis_art in ('leistungsbescheid', 'traeger', 'einkommen', 'immatrikulation', 'ablehnung', 'bescheinigung', 'sonstiges')
  );

-- Freitext „Gemeinnützigkeit des Partners“ → „Ergänzende Hinweise“
update public.initiativen
   set daten = jsonb_set(
         daten #- '{beschluss,gemeinnuetzigkeit}',
         '{beschluss,ergaenzendeHinweise}',
         to_jsonb(
           concat_ws(E'\n',
             nullif(daten #>> '{beschluss,ergaenzendeHinweise}', ''),
             daten #>> '{beschluss,gemeinnuetzigkeit}')
         ),
         true)
 where coalesce(daten #>> '{beschluss,gemeinnuetzigkeit}', '') <> '';
