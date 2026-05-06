# Active Context: KI-Zusammenfassung Umfragen

## Now
Umfrage-Admins koennen unter **Ergebnisse** eine deutschsprachige **KI-Zusammenfassung on-demand** erzeugen (Erstaufruf und „Neu generieren“). Claude wird primaer genutzt (`ANTHROPIC_*`), bei Fehler/Timeout **OpenAI** als Fallback (`OPENAI_*`). Ergebnis liegt in der DB (`surveys.ai_summary`, `ai_summary_generated_at`, `ai_summary_model`) und wird in **PDF** (Deckblatt) und **Excel** (erstes Sheet) exportiert.

## Next Steps
- SQL-Migration [lib/migrations/03_ai_summary.sql](lib/migrations/03_ai_summary.sql) in Supabase ausfuehren, falls noch nicht geschehen.
- In `.env.local`: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` setzen (siehe `.env.local.example`).
- Logo-Ersetzung / Mobile-Branding ggf. wie in progress.md.
