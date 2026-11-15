# Bernhard Riepl Stiftung – Webseite

Webseite der Bernhard Riepl Stiftung (Miesbach) mit öffentlichem Onepager, digitalem Förderantrag und Memberbereichen für Antragsteller und Stiftungsrat.

**Stand: Phase 2.** Datenbank, Anmeldung und Dokumentenspeicher laufen über Supabase (Region Frankfurt). Der E-Mail-Versand von Absagen über das Stiftungspostfach folgt in Phase 4.

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
3. **Deutsche E-Mails:** Unter **Authentication → Email Templates** für „Confirm signup“ und „Reset Password“ den Inhalt aus `supabase/email-vorlagen/` übernehmen. Der Betreff steht jeweils oben in der Datei. Diese Vorlagen funktionieren auch, wenn der Link in einem anderen Browser geöffnet wird.
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
| `lib/email.ts` | Phase 4: Versand über SMTP des Stiftungspostfachs (noch Simulation) |
| `supabase/migrations/` | Datenbankschema, RLS, Funktionen, Storage |

Die Typen in `lib/types.ts` entsprechen dem Datenmodell. Die Formulardaten eines Antrags liegen als JSON in `antraege.daten`. Name, Projekttitel und beantragter Betrag stehen zusätzlich als eigene Spalten für Suche und Auswertung bereit.
