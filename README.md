# Bernhard Riepl Stiftung – Webseite

Webseite der Bernhard Riepl Stiftung (Miesbach) mit öffentlichem Onepager, digitalem Förderantrag und Memberbereichen für Antragsteller und Stiftungsrat.

**Stand: Phase 4.** Datenbank, Anmeldung und Dokumentenspeicher laufen über Supabase (Region Frankfurt). E-Mails (Eingangsbestätigung, Benachrichtigung des Stiftungsrats, Absage) gehen über das SMTP-Postfach der Stiftung.

## Technik

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4 mit den Tokens des Design-Systems **Landhaus** (`app/globals.css`)
- Framer Motion für dezente Übergänge (Akkordeon, Formularschritte), folgt „Bewegung reduzieren“
- jsPDF für den PDF-Export des Antrags, zod für die Validierung
- Schriften Outfit und DM Sans liegen selbst gehostet in `app/fonts` (SIL Open Font License), es gibt keine Verbindung zu Google

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
cp .env.example .env.local   # Supabase-URL und Publishable Key eintragen
npm run dev                  # http://localhost:3000
```

Weitere Befehle:

```bash
npm run build      # Produktions-Build inkl. Typprüfung
npm run start      # Produktions-Build lokal starten
npm run typecheck  # nur TypeScript prüfen
```

## Phase 2 einrichten (Supabase)

Einmalig im Supabase-Dashboard des Projekts „B.R. Stiftung“:

1. **Datenbank anlegen:** Unter **SQL Editor → New query** den Inhalt von `supabase/migrations/20261115120000_phase2_grundschema.sql` einfügen und auf **Run** klicken. Das Skript lässt sich gefahrlos erneut ausführen.
2. **Adressen freigeben:** Unter **Authentication → URL Configuration** eintragen:
   - **Site URL:** die Produktionsadresse, z. B. `https://brstiftung.vercel.app` (später die eigene Domain)
   - **Redirect URLs:** `http://localhost:3000/**`, `https://brstiftung.vercel.app/**` und für Vorschau-Deployments `https://*.vercel.app/**`
3. **Deutsche E-Mails:** Erst möglich, wenn eigenes SMTP eingerichtet ist (siehe „Phase 4 einrichten“).
4. **Stiftungsrat freischalten:** Mit der eigenen E-Mail-Adresse unter `/registrieren` ein Konto anlegen und bestätigen. Dann `supabase/stiftungsrat-freischalten.sql` mit dieser Adresse im SQL Editor ausführen und neu anmelden. Neue Konten sind immer Antragsteller. Die Rolle Stiftungsrat lässt sich nur per SQL vergeben.
5. **Vercel:** Die Supabase-Integration setzt `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` und `SUPABASE_SECRET_KEY` automatisch. Nach dem ersten Verbinden einmal **Redeploy** auslösen, weil die öffentlichen Werte beim Build eingebaut werden.
6. **Lokal:** `.env.example` nach `.env.local` kopieren und URL und Publishable Key eintragen (Project Settings → API Keys). Den Secret Key braucht Phase 2 nicht.

**Hinweise**
- Der eingebaute E-Mail-Versand von Supabase ist nur für Tests gedacht und stark begrenzt. Für den Livegang unter **Authentication → SMTP Settings** das Postfach der Stiftung eintragen (spätestens mit Phase 4).
- Im Free-Plan pausiert Supabase ein Projekt nach einer Woche ohne Aktivität, Backups gibt es keine. Vor dem Livegang auf **Pro** wechseln.

### Was wo geschützt ist

| Ebene | Schutz |
|---|---|
| Datenbank (RLS) | Antragsteller lesen nur eigene Anträge, Dokumente und Absagen. Der Stiftungsrat liest alle Anträge und darf nur Status und bewilligten Betrag ändern. Nicht angemeldete Besucher haben keinen Zugriff. |
| Funktionen | `antrag_einreichen()` prüft Pflichtangaben und vergibt die Nummer `JJJJ-NNN` ohne Doppelvergabe. `antrag_ablehnen()` steht nur dem Stiftungsrat zur Verfügung. |
| Speicher | Privater Bucket `antragsdokumente` (PDF, JPG, PNG, max. 10 MB). Hochladen nur in eigene, neu eingegangene Anträge. Lesen nur über signierte Links, die 2 Minuten gültig sind. |
| Server | `middleware.ts` leitet nicht angemeldete Besucher zur Anmeldung und trennt die Bereiche `/konto` und `/stiftungsrat` nach Rolle. |
| Oberfläche | `RoleGuard` zeigt zusätzlich passende Hinweise. |

## Phase 4 einrichten (E-Mail-Versand)

### 1. Datenbank
Im Supabase **SQL Editor** den Inhalt von `supabase/migrations/20261117120000_phase4_email.sql` ausführen. Das legt das Mailprotokoll an und sorgt dafür, dass „Abgelehnt“ nur noch nach erfolgreich versendeter Absage gesetzt wird.

### 2. Umgebungsvariablen bei Vercel
Unter **Settings → Environment Variables** für **Production und Preview** eintragen und danach neu deployen:

| Variable | Wert |
|---|---|
| `SMTP_HOST` | Server des Mail-Anbieters, z. B. `smtp.ionos.de` |
| `SMTP_PORT` | `587` (STARTTLS) oder `465` (SSL/TLS) |
| `SMTP_SECURE` | `false` bei 587, `true` bei 465 |
| `SMTP_USER` | vollständige Postfach-Adresse |
| `SMTP_PASSWORD` | Passwort des Postfachs (als **Sensitive** markieren) |
| `MAIL_FROM` | Absenderadresse, in der Regel gleich `SMTP_USER` |
| `MAIL_STIFTUNGSRAT` | Empfänger neuer Anträge, mehrere mit Komma |
| `MAIL_BCC_ARCHIV` | Blindkopie jeder Absage, z. B. das Stiftungspostfach |
| `NEXT_PUBLIC_SITE_URL` | `https://brstiftung.vercel.app` |

`SUPABASE_SECRET_KEY` setzt die Supabase-Integration bereits. Er muss auch für **Preview** freigegeben sein.

**Test-Postfach statt echtem Versand:** Nur die Variablen umstellen.
- Lokal mit [Mailpit](https://mailpit.axllent.org): `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, Benutzer und Passwort leer. Die Mails erscheinen unter http://localhost:8025.
- Auf Vorschau-Deployments mit [Ethereal](https://ethereal.email): Konto anlegen, `SMTP_HOST=smtp.ethereal.email`, `SMTP_PORT=587`, `SMTP_SECURE=false` und die angezeigten Zugangsdaten. Diese Werte nur für **Preview** eintragen.

### 3. Supabase Auth über dasselbe Postfach
1. **Eigenes SMTP in Supabase einrichten** – Schritt für Schritt im Abschnitt [„Supabase: eigenes SMTP-Postfach“](#supabase-eigenes-smtp-postfach) weiter unten.
2. **Authentication → Rate Limits:** Das E-Mail-Limit steht nach dem Aktivieren auf 30 pro Stunde, das reicht.
3. **Authentication → Emails → Templates:**
   - „Confirm sign up“: Betreff und Inhalt aus `supabase/email-vorlagen/konto-bestaetigen.html`
   - „Reset password“: aus `passwort-zuruecksetzen.html`

   Der Betreff steht jeweils im Kommentar oben in der Datei. In die Inhaltsfelder kommt der Text ab `<!DOCTYPE html>`.
4. **Authentication → URL Configuration:**
   - Site URL: `https://brstiftung.vercel.app`
   - Redirect URLs: `http://localhost:3000/**`, `https://brstiftung.vercel.app/**`, `https://brstiftung-*-florian-s-projects4.vercel.app/**`

   Den bisherigen Eintrag `https://*.vercel.app/**` entfernen. Er erlaubt Weiterleitungen auf **jede** Vercel-Seite, auch fremde.

Die Links in den Auth-E-Mails führen immer zur Site URL, also zur Produktion. Das gilt auch, wenn man sich auf einer Vorschau registriert. Da Vorschau und Produktion dieselbe Datenbank nutzen, funktioniert das trotzdem.

### Supabase: eigenes SMTP-Postfach

Ohne eigenes SMTP verschickt Supabase Bestätigungs- und Passwort-Mails nur an Teammitglieder des Projekts und höchstens wenige pro Stunde. Für den echten Betrieb braucht es das Postfach der Stiftung. Beispiel: `antrag@bernhard-riepl-stiftung.de`.

**Vorher beim Mail-Anbieter bereitlegen** (Kundenbereich, meist unter „E-Mail → Postfach → Server-Einstellungen“):
- SMTP-Server (Postausgang), z. B. `smtp.ionos.de` bei IONOS
- Port und Verschlüsselung: `465` mit SSL/TLS oder `587` mit STARTTLS
- Benutzername: in der Regel die vollständige Adresse `antrag@bernhard-riepl-stiftung.de`
- Passwort des Postfachs

**In Supabase eintragen:**
1. [supabase.com/dashboard](https://supabase.com/dashboard) öffnen und das Projekt **B.R. Stiftung** wählen.
2. Links **Authentication**, dann **Emails**, oben den Reiter **SMTP Settings**.
3. **Enable custom SMTP** einschalten.
4. Felder ausfüllen:

   | Feld | Wert |
   |---|---|
   | Sender email address | `antrag@bernhard-riepl-stiftung.de` (gleich wie `MAIL_FROM` bei Vercel) |
   | Sender name | `Bernhard Riepl Stiftung` |
   | Host | SMTP-Server des Anbieters, z. B. `smtp.ionos.de` |
   | Port number | `465` (SSL/TLS) oder `587` (STARTTLS) – so wie vom Anbieter angegeben |
   | Minimum interval per user | `60` Sekunden (Standard lassen) |
   | Username | `antrag@bernhard-riepl-stiftung.de` |
   | Password | Postfach-Passwort – nur hier eingeben, nie in den Code oder in Chats |

5. **Save changes**.
6. **Authentication → Rate Limits:** „Rate limit for sending emails“ auf mindestens `30` pro Stunde stellen.
7. Bei Vercel dieselben Werte als `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true` bei 465, `false` bei 587), `SMTP_USER`, `SMTP_PASSWORD` und `MAIL_FROM` für **Production** eintragen (siehe [Abschnitt 2](#2-umgebungsvariablen-bei-vercel)) und neu deployen.

**Testen:**
1. In einem privaten Browserfenster unter `/registrieren` ein Konto mit einer eigenen, echten Adresse anlegen. Die Bestätigungs-Mail muss innerhalb einer Minute ankommen – Absender „Bernhard Riepl Stiftung“, Adresse `antrag@bernhard-riepl-stiftung.de`, Gestaltung wie in `supabase/email-vorlagen/`.
2. Link in der Mail anklicken: Sie landen angemeldet im Konto.
3. Abmelden, „Passwort vergessen?“ nutzen: Die Mail kommt an, der Link führt zu „Neues Passwort“.
4. Spam-Ordner prüfen. Landet die Mail dort, fehlen meist SPF/DKIM (siehe [DNS](#4-dns-beim-mail-anbieter-für-die-domain-der-absenderadresse)).
5. Kommt nichts an: **Supabase → Logs → Auth** zeigt die Fehlermeldung. Häufig sind falscher Port bzw. falsche Verschlüsselung (465 ↔ 587) oder ein Tippfehler im Passwort.
6. Danach einen Testantrag absenden und prüfen, ob Eingangsbestätigung und Benachrichtigung des Stiftungsrats ankommen (diese laufen über die Vercel-Variablen, nicht über Supabase).

### 4. DNS beim Mail-Anbieter (für die Domain der Absenderadresse)
- **SPF:** ein TXT-Eintrag auf der Domain, der den Mailserver des Anbieters erlaubt, z. B. `v=spf1 include:<vom Anbieter vorgegeben> ~all`. Pro Domain darf es nur einen SPF-Eintrag geben.
- **DKIM:** im Kundenbereich des Anbieters aktivieren und den angezeigten Eintrag (TXT oder CNAME, z. B. `<selector>._domainkey`) setzen.
- **DMARC:** TXT-Eintrag auf `_dmarc.<domain>`, zum Start `v=DMARC1; p=none; rua=mailto:<postfach@domain>`. Wenn alles sauber zugestellt wird, später auf `p=quarantine` erhöhen.

Prüfen lässt sich das mit einer Test-Mail an einen Gmail-Account („Original anzeigen“: SPF, DKIM und DMARC sollten „PASS“ zeigen) oder mit mail-tester.com.

### Ablauf und Absicherung
- **Antrag absenden:** Der Antrag wird zuerst gespeichert, danach versucht der Server die Mails 1 und 2. Ein Fehler beim Versand blockiert nichts. Er steht im Protokoll, und beim Stiftungsrat erscheinen ein Hinweis und „Benachrichtigung erneut senden“.
- **Absage:** Nur der Stiftungsrat, serverseitig geprüft. Erst E-Mail, dann Status. Schlägt der Versand fehl, bleibt der Status unverändert und der Text im Dialog erhalten. Ein Datenbank-Trigger verhindert „Abgelehnt“ ohne Versand.
- **Bewilligung:** Dialog mit Betrag, Empfänger, Betreff und vorbereitetem Text (`content/mailVorlagen.ts`, `BEWILLIGUNG_VORLAGE`). „Bewilligen und E-Mail senden“ setzt den Status erst nach erfolgreichem Versand (BCC an das Archiv); Abschnitte in eckigen Klammern müssen vorher ergänzt sein. „Nur bewilligen, keine E-Mail“ setzt Status und Betrag ohne Versand. Gespeichert werden Betrag, Text, Datum und Ratsmitglied (Tabelle `bewilligungen`).
- **Unterlagen nachreichen:** Antragsteller können bei „Eingegangen“ und „In Prüfung“ Dateien ergänzen (nur hinzufügen). Der Stiftungsrat erhält eine E-Mail an `MAIL_STIFTUNGSRAT` und sieht „Neue Unterlagen seit …“.
- **Empfänger** kommen immer aus der Datenbank (bestätigte Konto-Adresse) oder aus Umgebungsvariablen, nie aus der Anfrage.
- **Wiederholungssperre:** Eingangsmails gibt es je Antrag nur einmal. Erneutes Senden ist frühestens nach 2 Minuten möglich, eine zweite Absage frühestens nach 10 Minuten.
- **Protokoll** `mail_log` ohne Mailtext. Lesen darf nur der Stiftungsrat, schreiben nur der Server.
- **Keine Anhänge:** Antragsdaten und Bankverbindung bleiben hinter dem Login.

## Verbesserungen 2026-11 einrichten (Datenbank)

Im Supabase **SQL Editor** nacheinander ausführen, jeweils den Dateiinhalt einfügen und **Run**. Bestehende Daten bleiben erhalten; jede Datei kann gefahrlos erneut ausgeführt werden.

1. `20261118090000_admin_rolle_wert.sql` – **allein** ausführen (neuer Enum-Wert muss gespeichert sein, bevor er verwendet wird)
2. `20261118090100_admin_rechte.sql`
3. `20261118090200_unterlagen_nachreichen.sql`
4. `20261118090300_bewilligung.sql`

Jede Datei sollte mit „Success. No rows returned“ enden. Erst danach den Branch mergen bzw. deployen – sonst fehlen der Oberfläche die neuen Spalten und Funktionen.

## Rollen und Namen

| Rolle | Darf |
|---|---|
| `antragsteller` | Anträge stellen, eigene Anträge sehen, Unterlagen nachreichen. Standard für jede Registrierung. |
| `stiftungsrat` | Alle Anträge sehen, Status setzen, bewilligen, absagen. |
| `admin` | Alles wie der Stiftungsrat, dazu die lesende **Ansicht Antragsteller** (Menü bzw. `/stiftungsrat/antragsteller`). Admins können selbst keine Anträge einreichen. |

Rollen werden nur per SQL vergeben (Supabase → **SQL Editor**), danach meldet sich die Person neu an:

```sql
-- Admin
update public.profiles set rolle = 'admin' where email = 'name@beispiel.de';
-- Stiftungsrat
update public.profiles set rolle = 'stiftungsrat' where email = 'name@beispiel.de';
-- Zurück zum Antragsteller
update public.profiles set rolle = 'antragsteller' where email = 'name@beispiel.de';
```

Voraussetzung für `admin` sind die Migrationen `20261118090000_admin_rolle_wert.sql` und `20261118090100_admin_rechte.sql`.

**Namen eintragen:** Menü und Seitenkopf zeigen „Stiftungsrat – [Name]“, „Admin – [Name]“ bzw. „Konto von [Name]“. Ohne Namen erscheint die E-Mail-Adresse. Antragsteller geben ihren Namen bei der Registrierung an. Für Ratsmitglieder und Admins tragen Sie ihn in Supabase ein: **Table Editor → profiles →** Spalte `name` doppelklicken, Namen eingeben, **Save**. Oder per SQL:

```sql
update public.profiles set name = 'Dr. Maria Huber' where email = 'name@beispiel.de';
```

Die Änderung erscheint nach dem nächsten Neuladen der Seite.

## Go-live-Checkliste

Erst abhaken, wenn die Seite unter der eigenen Domain öffentlich gehen soll.

**Konten und Daten**
- [ ] Echte Konten für alle Ratsmitglieder angelegt, Rollen vergeben und Namen eingetragen (siehe [Rollen und Namen](#rollen-und-namen)); mindestens ein Admin.
- [ ] Testkonten `antrag@test.de` und `rat@test.de` samt Anträgen, Dokumenten und Protokolleinträgen entfernen: `supabase/migrations/MANUELL_vor_go_live_testkonten_loeschen.sql` im SQL Editor **abschnittsweise** ausführen (Vorschau → Storage-Dateien im Dashboard löschen → Löschen mit `rollback;` testen → auf `commit;` umstellen). Das Skript wird nie automatisch angewendet.
- [ ] Prüfen, dass keine weiteren Test-Anträge anderer Konten übrig sind (letzte Abfrage der Vorschau).

**E-Mail**
- [ ] Test-Postfach (Ethereal) ersetzen: Vercel **Production** und **Preview** auf das echte SMTP-Postfach umstellen (`SMTP_*`, `MAIL_FROM`), danach neu deployen.
- [ ] `MAIL_STIFTUNGSRAT` und `MAIL_BCC_ARCHIV` auf die echten Adressen setzen.
- [ ] Supabase **SMTP Settings** mit dem echten Postfach (siehe [Supabase: eigenes SMTP-Postfach](#supabase-eigenes-smtp-postfach)) und Mailvorlagen eingetragen.
- [ ] SPF, DKIM und DMARC gesetzt, Testmail landet nicht im Spam.

**Tarife und Betrieb**
- [ ] Supabase auf einen bezahlten Tarif (Pro) umstellen: Im kostenlosen Tarif pausiert das Projekt nach einer Woche ohne Zugriffe, und es gibt keine täglichen Backups.
- [ ] Vercel auf **Pro** umstellen: Der Hobby-Tarif ist nur für private, nicht-kommerzielle Nutzung gedacht.
- [ ] Backups in Supabase aktiv (Database → Backups).

**Domain**
- [ ] Domain bei Vercel unter **Settings → Domains** hinzugefügt und DNS beim Anbieter gesetzt, HTTPS aktiv.
- [ ] `NEXT_PUBLIC_SITE_URL` auf die Domain umgestellt, neu deployt.
- [ ] Supabase **URL Configuration**: Site URL auf die Domain, Domain in den Redirect URLs ergänzt.

**Recht und Inhalte**
- [ ] Impressum, Datenschutzerklärung und Haftungsausschluss rechtlich geprüft und freigegeben (`content/rechtstexte.ts`).
- [ ] Alle Platzhalter in eckigen Klammern ersetzt (z. B. Sitzungsrhythmus in den FAQ) – auf der Seite gelb markiert.
- [ ] Absage- und Bewilligungstexte vom Stiftungsrat freigegeben.

**Abschlusstest**
- [ ] Mit einem neuen Konto: registrieren, Antrag mit Dokumenten absenden, Eingangsbestätigung prüfen, Unterlagen nachreichen.
- [ ] Als Stiftungsrat: Benachrichtigung erhalten, Antrag öffnen, bewilligen bzw. absagen, E-Mails prüfen.
- [ ] Danach diesen Testantrag mit derselben Methode wie oben entfernen oder als Beispiel bewusst stehen lassen.

## Auf Vercel deployen

1. Auf [vercel.com](https://vercel.com) **Add New → Project** wählen und das GitHub-Repository `LiquidFlow82Go/Bernhard-Riepl-Stiftung` importieren.
2. Das Framework „Next.js“ wird erkannt. Build-Befehl und Ausgabeordner bleiben auf Standard.
3. Die Supabase-Variablen setzt die Supabase-Integration. Ergänzen Sie unter **Environment Variables** nur `NEXT_PUBLIC_SITE_URL`.
4. **Deploy**. Jeder Push auf `main` löst danach automatisch ein neues Deployment aus.
5. Die eigene Domain richten Sie unter **Settings → Domains** ein. Bei IONOS bzw. hosting.de setzen Sie dazu die DNS-Einträge, die Vercel anzeigt.

## Projektstruktur

```
app/                    Seiten (App Router)
  page.tsx              Onepager
  antrag/               Förderantrag (6 Schritte)
  konto/                Memberbereich Antragsteller
  stiftungsrat/         Memberbereich Stiftungsrat
  login, registrieren, passwort-vergessen, passwort-neu
  auth/confirm/         Rücksprung aus Bestätigungs- und Passwort-E-Mails
  impressum, datenschutz, haftungsausschluss
  fonts/                selbst gehostete Schriften
components/
  layout/               Header, Footer, Logo, Cookie-Hinweis, Rechtstext-Seite
  sections/             Hero, Die Stiftung, Stiftungszweck, Förderantrag, FAQ, Kontakt
  auth/                 AuthProvider, RoleGuard, Login-/Registrierungsformulare
  antrag/               Wizard, Schritte, Betragsfelder, Upload, Zusammenfassung
  konto/                Übersicht und Detail Antragsteller
  stiftungsrat/         Tabelle, Detail, Absagedialog
  ui/                   Button, Felder, Akkordeon, Dialog, Badges
content/                alle Texte: Stiftung/Satzung, FAQ, Rechtstexte, absageVorlagen.ts
lib/                    Typen, Datenzugriff, Validierung, Beträge, PDF, Auth, E-Mail
supabase/               Migration, E-Mail-Vorlagen, SQL zum Freischalten des Stiftungsrats
middleware.ts           Sitzung erneuern, Memberbereiche schützen
public/                 Bilder, Stiftungssymbol, Favicons
```

## Inhalte pflegen

- Texte der Stiftung, Präambel und Satzung stehen in `content/stiftung.ts`.
- FAQ: `content/faq.ts`
- Impressum, Datenschutz und Haftungsausschluss: `content/rechtstexte.ts`. Angaben in `[eckigen Klammern]` werden auf der Seite gelb markiert, bis sie ersetzt sind.
- Absagetexte: `content/absageVorlagen.ts`. Platzhalter wie `{antragsnummer}` werden beim Öffnen des Dialogs gefüllt.
- Pflichtfelder: `PFLICHTFELDER` in `lib/antragSchema.ts`. Ein Eintrag genügt, dann richten sich Stern, Fehlermeldung und Fehlerübersicht automatisch danach.

## Datenzugriff

Alle Datenzugriffe laufen über Funktionen in `lib/`. Die Komponenten kennen Supabase nicht direkt.

| Datei | Aufgabe |
|---|---|
| `lib/supabase/` | Clients für Browser und Server, Zugangsdaten aus der Umgebung |
| `lib/auth.ts` | Anmelden, Registrieren, Passwort zurücksetzen und neu setzen, Profil laden |
| `lib/antraege.ts` | Anträge lesen, filtern, einreichen, Status ändern, ablehnen |
| `lib/dokumente.ts` | Prüfung der Uploads, signierte Links zum Ansehen und Herunterladen |
| `lib/email.ts` | Schnittstelle der Oberfläche zum Versand (ruft die Route Handler auf) |
| `lib/mail.ts` | Versand per Nodemailer über SMTP, Protokoll in `mail_log` (nur Server) |
| `content/mailVorlagen.ts` | Texte und HTML der E-Mails |
| `app/api/antraege/[id]/…` | Route Handler `benachrichtigen` und `absage` mit Rollenprüfung |
| `supabase/migrations/` | Datenbankschema, RLS, Funktionen, Storage |

Die Typen in `lib/types.ts` entsprechen dem Datenmodell. Die Formulardaten eines Antrags liegen als JSON in `antraege.daten`. Name, Projekttitel und beantragter Betrag stehen zusätzlich als eigene Spalten für Suche und Auswertung bereit.
