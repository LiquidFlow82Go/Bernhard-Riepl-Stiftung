-- =====================================================================
-- Verbesserungen 2026-11, Punkt 5: Unterlagen nachreichen
--
-- - Dokumente erhalten das Kennzeichen „nachgereicht“ (automatisch, wenn
--   sie später als 30 Minuten nach dem Einreichen hochgeladen werden).
-- - Hochladen ist bei Status „Eingegangen“ und „In Prüfung“ erlaubt,
--   nur zu eigenen Anträgen, nur einfügen (kein Ändern, kein Löschen).
-- - Der Stiftungsrat kann neue Unterlagen als „gesehen“ markieren.
-- Bestehende Daten bleiben erhalten. Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================

alter table public.dokumente add column if not exists nachgereicht boolean not null default false;
alter table public.antraege add column if not exists unterlagen_gesehen_am timestamptz;

-- Kennzeichen und Zeitpunkt setzt die Datenbank, nicht der Browser.
create or replace function public.dokument_kennzeichnen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.hochgeladen_am := now();
  new.nachgereicht := exists (
    select 1 from public.antraege a
    where a.id = new.antrag_id and a.eingereicht_am < now() - interval '30 minutes'
  );
  return new;
end;
$$;

drop trigger if exists dokumente_kennzeichnen on public.dokumente;
create trigger dokumente_kennzeichnen
  before insert on public.dokumente
  for each row execute function public.dokument_kennzeichnen();

-- Einfügen zu eigenen Anträgen mit Status „Eingegangen“ oder „In Prüfung“
drop policy if exists "Dokumente zum eigenen, neuen Antrag hinzufügen" on public.dokumente;
drop policy if exists "Dokumente zum eigenen, offenen Antrag hinzufügen" on public.dokumente;
create policy "Dokumente zum eigenen, offenen Antrag hinzufügen" on public.dokumente
  for insert to authenticated
  with check (
    exists (
      select 1 from public.antraege a
      where a.id = antrag_id
        and a.benutzer_id = (select auth.uid())
        and a.status in ('eingegangen', 'in_pruefung')
    )
  );

drop policy if exists "Antragsdokumente hochladen" on storage.objects;
create policy "Antragsdokumente hochladen" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'antragsdokumente'
    and exists (
      select 1 from public.antraege a
      where a.id::text = (storage.foldername(name))[1]
        and a.benutzer_id = (select auth.uid())
        and a.status in ('eingegangen', 'in_pruefung')
    )
  );

-- Kein Ändern oder Löschen von Dokumenten durch Benutzer (zur Sicherheit erneut entzogen)
revoke update, delete on public.dokumente from authenticated, anon;

-- Stiftungsrat darf „Unterlagen gesehen“ setzen (die Update-Regel für den Rat besteht bereits)
grant update (unterlagen_gesehen_am) on public.antraege to authenticated;

-- Mailprotokoll: neue Arten
alter table public.mail_log drop constraint if exists mail_log_art_check;
alter table public.mail_log add constraint mail_log_art_check
  check (art in ('eingang_antragsteller', 'eingang_stiftungsrat', 'absage', 'nachreichung', 'bewilligung'));
