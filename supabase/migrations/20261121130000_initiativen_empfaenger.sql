-- =====================================================================
-- Eigene Initiativen – Nachtrag, Punkt 1: Empfänger der Förderung
--
-- Neue Spalte empfaenger_art (organisation | oeffentlich | privat) für Liste
-- und Filter. Bestehende Initiativen werden auf „Gemeinnützige Organisation“
-- gesetzt (Spalte und Formulardaten). Bei Privatpersonen steht in partner_name
-- nur „Einzelfallhilfe – Initialen“; der volle Name nur in den Formulardaten.
-- Bestehende Daten bleiben erhalten. Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

alter table public.initiativen
  add column if not exists empfaenger_art text not null default 'organisation';

alter table public.initiativen drop constraint if exists initiativen_empfaenger_art_check;
alter table public.initiativen add constraint initiativen_empfaenger_art_check
  check (empfaenger_art in ('organisation', 'oeffentlich', 'privat'));

create index if not exists initiativen_empfaenger_idx on public.initiativen (empfaenger_art);

-- Vorstand/Admin dürfen die Empfängerart beim Bearbeiten setzen
grant update (empfaenger_art) on public.initiativen to authenticated;

-- Bestehende Formulardaten ergänzen
update public.initiativen
   set daten = jsonb_set(daten, '{stammdaten,empfaengerArt}', '"organisation"', true)
 where daten ? 'stammdaten'
   and coalesce(daten #>> '{stammdaten,empfaengerArt}', '') = '';
