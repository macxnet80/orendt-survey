# System Patterns: Orendt Studios Mitarbeiter-Umfrage

## Architecture
- **Next.js App Router**: Standard file-based routing.
- **Client Components**: Used for interactive sections (Survey, AdminDashboard).
- **API Routes**: Handle Supabase communication for questions and responses; **KI**: `POST /api/ai/summarize` (Node runtime) mit Auth via `Authorization: Bearer` + `auth.getUser(jwt)`.

## AI / Provider-Fallback
- **Claude → OpenAI**: Server-only `fetch` (kein SDK), Timeouts ca. 30 s. Keine `NEXT_PUBLIC_` Keys.
- **Datenfluss**: Nach Admin-Check Service-Role laedt Survey, Fragen, Responses (paginiert); Prompt in [lib/ai-summary.js](lib/ai-summary.js); Update `surveys` mit Zusammenfassung.

## Design Standards
- Premium Look: Schwarz/Weiß branding.
- Tailwind tokens define the color palette.
- Semantic HTML and accessibility prioritized.
