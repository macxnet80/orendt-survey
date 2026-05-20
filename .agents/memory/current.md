# Aktueller Stand – OSHH-Survey

## Letzte Änderungen

- Migration `03_ai_summary` in Supabase (OSHH) angewendet: Spalten `ai_summary`, `ai_summary_generated_at`, `ai_summary_model` auf `surveys`.

## Fokus

- KI-Zusammenfassung im Admin-Dashboard testen.

## Nächste Schritte

- „KI-Zusammenfassung generieren“ erneut ausführen und PDF/Excel-Export prüfen.

## Offene Punkte

- API-Keys (`ANTHROPIC_*` / `OPENAI_*`) müssen in `.env.local` gesetzt sein, sonst schlägt die Generierung fehl.
