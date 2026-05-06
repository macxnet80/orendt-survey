-- Optional survey end date (calendar day, interpreted as Europe/Berlin in app code).
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS expires_at DATE;

-- pg_cron: deactivate surveys whose expires_at Berlin calendar day has ended.
-- Runs daily at 21:59 UTC (~23:59 CEST / ~22:59 CET).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT jobid FROM cron.job WHERE jobname = 'expire-surveys')
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

SELECT cron.schedule(
  'expire-surveys',
  '59 21 * * *',
  $$UPDATE public.surveys
    SET is_active = false, updated_at = now()
    WHERE expires_at IS NOT NULL
      AND expires_at < (timezone('Europe/Berlin', now()))::date
      AND is_active = true$$
);
