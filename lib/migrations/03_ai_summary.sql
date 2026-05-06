-- KI-Zusammenfassung pro Umfrage (gespeicherter Text vom Admin-Endpunkt)
-- In Supabase SQL Editor ausfuehren (oder MCP apply_migration).

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_summary_model TEXT;
