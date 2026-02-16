-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active surveys"
  ON surveys FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access surveys"
  ON surveys FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default survey
INSERT INTO surveys (slug, title, description)
VALUES ('allgemein', 'Allgemeine Mitarbeiter-Umfrage', 'Standard-Umfrage für Mitarbeiter-Feedback')
ON CONFLICT (slug) DO NOTHING;

-- Add survey_id to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE;

-- Link existing questions to the default survey
DO $$
DECLARE
  default_survey_id UUID;
BEGIN
  SELECT id INTO default_survey_id FROM surveys WHERE slug = 'allgemein' LIMIT 1;
  IF default_survey_id IS NOT NULL THEN
    UPDATE questions SET survey_id = default_survey_id WHERE survey_id IS NULL;
  END IF;
END $$;

-- Make survey_id NOT NULL after migration
ALTER TABLE questions ALTER COLUMN survey_id SET NOT NULL;

-- Add survey_id to responses
ALTER TABLE responses ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE;

-- Link existing responses to the default survey (optional, mostly for consistency)
DO $$
DECLARE
  default_survey_id UUID;
BEGIN
  SELECT id INTO default_survey_id FROM surveys WHERE slug = 'allgemein' LIMIT 1;
  IF default_survey_id IS NOT NULL THEN
    UPDATE responses SET survey_id = default_survey_id WHERE survey_id IS NULL;
  END IF;
END $$;

-- Make survey_id NOT NULL after migration
ALTER TABLE responses ALTER COLUMN survey_id SET NOT NULL;


-- Update default questions query policy to filter by survey if needed (RLS)
-- But mostly we will filter in the query itself.
