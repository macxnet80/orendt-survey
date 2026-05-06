# Orendt Studios – Mitarbeiter-Umfrage

Digitale Umfrage-App für die anonyme Befragung von Mitarbeitern, mit Admin-Dashboard zur Verwaltung der Fragen und Auswertung der Ergebnisse.

## Features

- **Anonyme Umfrage** – Step-by-Step Formular, mobilfreundlich
- **Admin Dashboard** (`/admin`) – Fragen verwalten (erstellen, bearbeiten, löschen)
- **Ergebnis-Auswertung** – Balkendiagramme, Rating-Durchschnitte, Freitext-Antworten
- **Supabase Backend** – Alle Daten in PostgreSQL gespeichert
- **Orendt Studios Branding** – Schwarz/Weiß mit Accent-Farbe

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Vercel (Deployment)

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Supabase Projekt erstellen

1. Erstelle ein Projekt auf [supabase.com](https://supabase.com)
2. Öffne den SQL Editor und führe `lib/database.sql` sowie die Dateien unter `lib/migrations/` aus (Reihenfolge nach Dateiname). Für automatisches Enddatum der Umfragen zusätzlich `lib/migrations/04_survey_expires_at.sql` (`expires_at` + optional `pg_cron`).
3. Kopiere URL und Anon Key aus den Projekteinstellungen

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Trage deine Supabase-Werte ein:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_ADMIN_PASSWORD=dein-sicheres-passwort
```

### 4. Starten

```bash
npm run dev
```

- Umfrage: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Projektstruktur

```
orendt-survey/
├── app/
│   ├── layout.js          # Root Layout + Fonts
│   ├── page.js            # Umfrage (öffentlich)
│   ├── globals.css         # Tailwind + Custom Styles
│   ├── admin/
│   │   └── page.js        # Admin Dashboard
│   └── api/
│       ├── questions/      # CRUD für Fragen
│       └── responses/      # CRUD für Antworten
├── components/
│   ├── Survey.jsx          # Umfrage-Komponente
│   └── AdminDashboard.jsx  # Admin mit Editor + Auswertung
├── lib/
│   ├── supabase.js         # Supabase Client + DB Functions
│   ├── defaults.js         # Default-Fragen (Fallback)
│   └── database.sql        # SQL Migration
└── tailwind.config.js      # Orendt Branding Tokens
```

## Admin-Passwort

Standard: `orendt2026` – Ändere dies in `.env.local` vor dem Deployment!

## Deployment (Vercel)

```bash
vercel
```

Environment Variables in den Vercel-Projekteinstellungen hinterlegen.
