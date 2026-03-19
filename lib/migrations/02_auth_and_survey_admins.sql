-- Migration 02: Supabase Auth + Multi-Admin per Survey
-- Run this in the Supabase SQL Editor

-- 1. Create survey_admins table (links auth users to surveys)
CREATE TABLE IF NOT EXISTS survey_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- 2. RLS for survey_admins
ALTER TABLE survey_admins ENABLE ROW LEVEL SECURITY;

-- Admins can see who else is admin on their surveys
CREATE POLICY "Admins can view survey_admins for their surveys"
  ON survey_admins FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM survey_admins sa2
      WHERE sa2.survey_id = survey_admins.survey_id
        AND sa2.user_id = auth.uid()
    )
  );

-- Admins can add/remove other admins on their surveys
CREATE POLICY "Admins can insert survey_admins for their surveys"
  ON survey_admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_admins sa2
      WHERE sa2.survey_id = survey_id
        AND sa2.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete survey_admins for their surveys"
  ON survey_admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM survey_admins sa2
      WHERE sa2.survey_id = survey_admins.survey_id
        AND sa2.user_id = auth.uid()
    )
  );

-- 3. Update surveys RLS: logged-in admins see their own surveys
-- (Keep public read for is_active=true for survey participants)
-- Add policy for admins to manage their surveys
CREATE POLICY "Admins can manage their surveys"
  ON surveys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM survey_admins
      WHERE survey_admins.survey_id = id
        AND survey_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_admins
      WHERE survey_admins.survey_id = id
        AND survey_admins.user_id = auth.uid()
    )
  );

-- 4. Update questions RLS: admins of the survey can manage questions
CREATE POLICY "Admins can manage questions of their surveys"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM survey_admins
      WHERE survey_admins.survey_id = questions.survey_id
        AND survey_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_admins
      WHERE survey_admins.survey_id = questions.survey_id
        AND survey_admins.user_id = auth.uid()
    )
  );

-- 5. Update responses RLS: admins of the survey can view/delete responses
CREATE POLICY "Admins can manage responses of their surveys"
  ON responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM survey_admins
      WHERE survey_admins.survey_id = responses.survey_id
        AND survey_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_admins
      WHERE survey_admins.survey_id = responses.survey_id
        AND survey_admins.user_id = auth.uid()
    )
  );

-- 6. Helper function to add first admin when creating a survey
-- (optional, called from the app after createSurvey)
