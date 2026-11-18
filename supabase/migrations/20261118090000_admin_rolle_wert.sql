-- =====================================================================
-- Verbesserungen 2026-11, Punkt 6 (Teil 1 von 2): neue Rolle „admin“
--
-- ZUERST und EINZELN ausführen (eigene Query im SQL Editor).
-- PostgreSQL kann einen neuen Wert einer Aufzählung erst verwenden,
-- nachdem er gespeichert ist – deshalb steht er in einer eigenen Datei.
-- Kann gefahrlos erneut ausgeführt werden.
-- =====================================================================
alter type public.rolle add value if not exists 'admin';
