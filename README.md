# Bernhard Riepl Stiftung – Webseite

Webseite der Bernhard Riepl Stiftung (Miesbach) mit öffentlichem Onepager, digitalem Förderantrag und Memberbereichen für Antragsteller und Stiftungsrat.

**Stand: Phase 1 (Oberfläche).** Alle Daten sind Beispieldaten und liegen im Browser (localStorage). Datenbank, Login und E-Mail-Versand folgen in den Phasen 2 bis 4.

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
cp .env.example .env.local   # in Phase 1 noch ohne Wirkung
npm run dev                  # http://localhost:3000
```

Weitere Befehle:

```bash
npm run build      # Produktions-Build inkl. Typprüfung
npm run start      # Produktions-Build lokal starten
npm run typecheck  # nur TypeScript prüfen
```

## Testanmeldung (Phase 1)

Unter `/login` gibt es den Kasten **Testanmeldung** mit zwei Schaltern:

| Rolle | Schalter | oder E-Mail | Passwort |
|---|---|---|---|
| Antragsteller | „Als Antragsteller ansehen“ | `antragsteller@beispiel.de` | `Stiftung2026!` |
| Stiftungsrat | „Als Stiftungsrat ansehen“ | `stiftungsrat@beispiel.de` | `Stiftung2026!` |

Mit „Beispieldaten zurücksetzen“ stellen Sie den Ausgangszustand wieder her. Neu registrierte Konten erhalten immer die Rolle Antragsteller.

So probieren Sie den Ablauf aus:

1. Als Antragsteller anmelden, unter `/antrag` einen Antrag ausfüllen und absenden. Die Nummer wird im Format `JJJJ-NNN` vergeben, z. B. `2026-004`.
2. Unter `/konto` erscheint der Antrag mit Status, PDF-Download und Dokumenten.
3. Als Stiftungsrat anmelden. Unter `/stiftungsrat` finden Sie den Antrag, können Status und bewilligten Betrag setzen oder über einen der acht Ausschlussgründe eine Absage vorbereiten.

## Auf Vercel deployen

1. Auf [vercel.com](https://vercel.com) **Add New → Project** wählen und das GitHub-Repository `LiquidFlow82Go/Bernhard-Riepl-Stiftung` importieren.
2. Das Framework „Next.js“ wird erkannt. Build-Befehl und Ausgabeordner bleiben auf Standard.
3. Unter **Environment Variables** setzen Sie vorerst nur `NEXT_PUBLIC_SITE_URL`, z. B. die spätere Domain. Die übrigen Variablen aus `.env.example` kommen ab Phase 2 dazu.
4. **Deploy**. Jeder Push auf `main` löst danach automatisch ein neues Deployment aus.
5. Die eigene Domain richten Sie unter **Settings → Domains** ein. Bei IONOS bzw. hosting.de setzen Sie dazu die DNS-Einträge, die Vercel anzeigt.

## Projektstruktur

```
app/                    Seiten (App Router)
  page.tsx              Onepager
  antrag/               Förderantrag (6 Schritte)
  konto/                Memberbereich Antragsteller
  stiftungsrat/         Memberbereich Stiftungsrat
  login, registrieren, passwort-vergessen
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
public/                 Bilder, Stiftungssymbol, Favicons
```

## Inhalte pflegen

- Texte der Stiftung, Präambel und Satzung stehen in `content/stiftung.ts`.
- FAQ: `content/faq.ts`
- Impressum, Datenschutz und Haftungsausschluss: `content/rechtstexte.ts`. Angaben in `[eckigen Klammern]` werden auf der Seite gelb markiert, bis sie ersetzt sind.
- Absagetexte: `content/absageVorlagen.ts`. Platzhalter wie `{antragsnummer}` werden beim Öffnen des Dialogs gefüllt.
- Pflichtfelder: `PFLICHTFELDER` in `lib/antragSchema.ts`. Ein Eintrag genügt, dann richten sich Stern, Fehlermeldung und Fehlerübersicht automatisch danach.

## Vorbereitung für Phase 2 (Supabase)

Alle Datenzugriffe laufen über Funktionen in `lib/`. In Phase 2 ändert sich nur deren Umsetzung, die Aufrufe in den Komponenten bleiben gleich.

| Datei | Phase 1 | Phase 2 |
|---|---|---|
| `lib/auth.ts` | Testkonten, Sitzung im localStorage | Supabase Auth (`signInWithPassword`, `signUp`, `resetPasswordForEmail`), Rolle aus `profiles` |
| `lib/antraege.ts` | Beispieldaten (`lib/mockDb.ts`) | Tabellen `antraege`, `dokumente`, `absagen` mit Row Level Security |
| `lib/antragsnummer.ts` | höchste Nummer + 1 | Postgres-Funktion mit Sperre (keine Doppelvergabe) |
| `lib/dokumente.ts` | Dateien nur im Browser | Supabase Storage, Bucket `antragsdokumente`, signierte URLs |
| `lib/email.ts` | Simulation | Route Handler mit nodemailer über SMTP des Stiftungspostfachs (Phase 4) |
| `components/auth/RoleGuard.tsx` | prüft Testsitzung | zusätzlich Middleware und RLS serverseitig |

Die Typen in `lib/types.ts` entsprechen dem geplanten Datenmodell. Die benötigten Umgebungsvariablen stehen in `.env.example`.
