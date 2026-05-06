# Tech Context: Orendt Studios Mitarbeiter-Umfrage

## Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Dependencies
- `lucide-react` (icons)
- `@supabase/supabase-js`
- `jspdf`, `jspdf-autotable`, `xlsx` (Exports)
- KI-Oberflaeche ohne zusaetzliches SDK: `fetch` zu Anthropic / OpenAI

## Umgebungsvariablen (Auszug)
- Supabase: `NEXT_PUBLIC_SUPABASE_*`, server: `SUPABASE_SERVICE_ROLE_KEY`
- KI (nur Server): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, optional `ANTHROPIC_MODEL`, `OPENAI_MODEL`
