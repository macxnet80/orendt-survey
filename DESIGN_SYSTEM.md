# Orendt Studios — Design System

Dieses Dokument beschreibt die visuellen und interaktiven Grundlagen des **orendt-survey**-Projekts (Next.js + Tailwind CSS). Es dient als Referenz für weitere interne Web-Projekte im gleichen Corporate Look.

---

## 1. Markenprinzipien

| Aspekt | Richtung |
|--------|----------|
| **Stimmung** | Klar, professionell, technisch-präzise; hoher Kontrast (Schwarz/Weiß) mit **Akzentfarbe Gelbgrün** |
| **Typografie** | **Sora** für Überschriften und UI-Labels, **Instrument Sans** für Fließtext und Formulare |
| **Layout** | Viel Weißraum, Karten mit weichen Ecken (`rounded-xl` / `rounded-2xl`), dezente Raster-Hintergründe wo passend |
| **Sprache UI** | Deutsch; Überschriften oft **UPPERCASE** mit **Letter-Spacing** (Tracking) |

---

## 2. Farben

### 2.1 Markenfarben (CSS-Variablen & Tailwind `orendt.*`)

| Token / Klasse | Hex | Verwendung |
|----------------|-----|------------|
| `orendt-black` | `#0A0A0A` | Primärtext, volle Flächen, Primär-Buttons (mit Akzent-Text) |
| `orendt-dark` | `#1A1A1A` | — (Palette; dunkle Flächen) |
| `orendt-white` | `#FFFFFF` | Seitenhintergrund, Karten |
| `orendt-accent` | `#E8FF00` | Akzente, Auswahl-Highlights, CTA-Buttons, Fokus-Kontur-Ergänzung, letzte Zeile von Landing-Headlines |

**CSS-Variablen** (in `app/globals.css`): `--orendt-black`, `--orendt-accent`, `--orendt-white`.

### 2.2 Graustufen (`orendt.gray.*`)

| Stufe | Hex | Typische Nutzung |
|-------|-----|------------------|
| 900 | `#222222` | — |
| 800 | `#333333` | — |
| 700 | `#555555` | Nebeninfos auf dunklem Hintergrund |
| 600 | `#777777` | — |
| 500 | `#999999` | Sekundärtext, Beschreibungen |
| 400 | `#BBBBBB` | Dezente Links, Platzhalter |
| 300 | `#DDDDDD` | Icons in Ruhezustand |
| 200 | `#EEEEEE` | Rahmen, Fortschrittsbalken-Hintergrund |
| 100 | `#F5F5F5` | Leichte Flächen, Trennlinien |
| 50 | `#FAFAFA` | Seitenhintergrund (z. B. Startseite) |

### 2.3 Semantische Farben (System / Admin)

- **Fehler:** `text-red-500` für Fehlermeldungen.
- **Erfolg:** z. B. `bg-green-50`, `stroke` Grün für Bestätigungs-Icons (Login Reset).
- **Frage-Typ-Badges (Admin):** Tailwind-Semantik: `blue` (Single), `purple` (Multiple), `amber` (Rating), `green` (Text) — nur im Admin-Kontext.

### 2.4 Farbregeln

- **Selektion:** Hintergrund Akzent, Text schwarz (`::selection` in `globals.css`).
- **Fokus sichtbar:** `outline: 2px solid var(--orendt-accent)`, `outline-offset: 2px` (`*:focus-visible`).

---

## 3. Typografie

### 3.1 Schriftarten

| Rolle | Familie | Einbindung |
|-------|---------|------------|
| **Display** | Sora | Google Fonts, Weights 300–800 |
| **Body** | Instrument Sans | Google Fonts, Weights 400–700 |

Tailwind: `font-display`, `font-body` (in `tailwind.config.js` auf CSS-Variablen gemappt).

### 3.2 Anwendung

- **Hero / große Titel:** `font-display`, `font-bold`, oft `uppercase`, `tracking-tight`; responsive per `clamp()` möglich.
- **Seitenüberschriften (rechtliche Seiten):** z. B. `text-4xl md:text-5xl`, `uppercase`, `tracking-tight`.
- **Eyebrow / Label:** `text-[10px]`–`text-xs`, `uppercase`, `tracking-widest` oder `tracking-[0.2em]`, `font-display`, `font-semibold`, Farbe `orendt-gray-500` / `400`.
- **Fließtext:** `font-body`, `leading-relaxed`, `text-orendt-gray-600`–`800`.
- **Formular-Labels (kompakt):** `text-xs`, `font-display`, `font-semibold`, `tracking-wider`, `uppercase`, `text-orendt-gray-500`.

### 3.3 Größen (Aus dem Projekt abgeleitet)

- Kleine UI: `text-[10px]`, `text-xs`, `text-sm`
- Standard: `text-base`, `text-[15px]` (Umfrage-Optionen)
- Karten-Titel: `text-lg`–`text-xl`
- Hero: `clamp` / `text-4xl`+

---

## 4. Abstände, Raster & Layout

- **Maximale Lesbreite:** oft `max-w-md` (Listen), `max-w-sm`–`max-w-4xl` (Content), `max-w-7xl` (Footer).
- **Seiten-Padding:** häufig `p-6`, `px-5 md:px-14` (Landing).
- **Vertikal:** `space-y-4`–`space-y-12` für gestapelte Inhalte.
- **Mindesthöhe Viewport:** `min-h-dvh` für Vollflächen-Layouts.

---

## 5. Form & Oberflächen

| Element | Konvention |
|---------|------------|
| **Karten** | `bg-white`, `rounded-2xl`, `border border-orendt-gray-100` oder `border-2 border-orendt-gray-200`, `shadow-xl` / `shadow-sm` |
| **Interaktive Karten / Zeilen** | `rounded-xl`, `border-2`, Hover: `hover:border-orendt-black`, `hover:-translate-y-1`, `hover:shadow-lg`, `transition-all duration-200` |
| **Primär-Button (schwarz)** | `bg-orendt-black`, `text-orendt-accent`, `font-display`, `font-semibold`, `rounded-xl`, `hover:opacity-90` |
| **Sekundär-Button** | `border-2 border-orendt-gray-200`, `text-orendt-gray-600`, `hover:bg-orendt-gray-50` |
| **CTA (Landing)** | `bg-orendt-accent`, `text-orendt-black`, `rounded-full`, `uppercase`, `tracking-widest`, `hover:scale-105`, `active:scale-95` |
| **Textfelder** | `rounded-xl`, `border-2 border-orendt-gray-200`, `bg-orendt-gray-50`, `focus:border-orendt-black`, `focus:outline-none` (globales `focus-visible` ergänzt Akzent) |
| **Modale Overlay** | `fixed inset-0 bg-black/50`, Inhalt `animate-fade-in`, Panel `rounded-2xl`, `shadow-2xl` |
| **Logo-Container** | `bg-orendt-black`, `rounded-lg` oder `rounded-2xl`, Padding je nach Kontext; optional leichte Rotation auf Login (`-rotate-2`) |
| **Fortschritt** | Höhe `3px`, Track `bg-orendt-gray-200`, Fill `bg-orendt-black`, `transition-all duration-500` |
| **Trennlinien** | `border-orendt-gray-100` / `200`, horizontale Akzentlinie z. B. `h-px bg-orendt-accent opacity-20` |

---

## 6. Hintergründe & Texturen

- **Startseite:** `bg-orendt-gray-50` mit Hintergrundbild `bg-[url('/grid.svg')]` (Asset unter `public/`).
- **Landing Umfrage:** Vollfläche `bg-orendt-black`, helle Typografie, Akzent auf letzter Headline-Zeile.
- **Header (rechtliche Seiten):** `bg-white/80 backdrop-blur-md`, `border-b border-orendt-gray-100`.

---

## 7. Animationen

In `tailwind.config.js` registriert:

| Klasse | Effekt |
|--------|--------|
| `animate-fade-in` | Einblendung Opacity |
| `animate-slide-up` | Von unten + Opacity |
| `animate-slide-right` / `animate-slide-left` | Horizontal |
| `animate-scale-in` | Leichtes Zoomen (Erfolgsscreen) |
| `animate-pulse` | Akzent-Puls (Schatten, `accentPulse`) |

In `globals.css`:

- **`animate-stagger`** — Kinder nacheinander mit `fadeSlideIn` (Delays 0.05s–0.5s).

**Transitions:** häufig `duration-200`, `transition-all` oder gezielt `colors`, `transform`.

---

## 8. Icons

- **Stil:** Outline, `strokeWidth` 2–2.5, `strokeLinecap="round"`, `strokeLinejoin="round"` wo passend.
- **Farbe:** über `currentColor` oder explizit `text-orendt-gray-*` / Akzent.
- **Bibliothek im Projekt:** `lucide-react` als Dependency; viele Views nutzen **inline SVG** im gleichen Stil.

---

## 9. Navigations- & Rechts-Pattern

- **`LegalNavLinks`:** `variant="light"` (helle Seiten) vs. `variant="dark"` (dunkle Landing: Links mit Hover zu `orendt-accent`).
- **Footer (`LegalFooter`):** zentriert, `uppercase`, `tracking-widest`, `text-orendt-gray-400`, Hover zu Schwarz.

---

## 10. Barrierefreiheit

- Sichtbarer **Fokus** global mit Akzentfarbe.
- **`aria-label`** wo sinnvoll (z. B. Bewertungsgruppen in der Umfrage).
- Touch: `touch-manipulation` bei dichten Klickflächen (Rating).

---

## 11. Technische Replikation

| Bestandteil | Datei / Ort |
|-------------|-------------|
| Tailwind-Theme | `tailwind.config.js` (`colors.orendt`, `fontFamily`, `animation`) |
| Globale Basis | `app/globals.css` |
| Schrift-Import | Google Fonts in `globals.css` |
| Logo (PNG) | `/public/orendtstudios_logo.png` |

**Minimaler Setup für neue Projekte:** Tailwind 3.x, dieselben `extend`-Einträge und `globals.css`-Variablen übernehmen; Komponenten an `font-display` / `font-body` und `orendt-*`-Farben binden.

---

## 12. Version & Quelle

- Abgeleitet aus dem Repository **orendt-survey** (Next.js 14, React 18, Tailwind 3.4).
- Bei Änderungen am Theme zuerst `tailwind.config.js` und `globals.css` pflegen, dann dieses Dokument aktualisieren.
