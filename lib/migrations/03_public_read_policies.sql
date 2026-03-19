-- Migration 03: Public Read Access for Questions and Response Submission
-- Run this in the Supabase SQL Editor
--
-- Problem: Migration 02 added admin-only policies for questions and responses,
-- but forgot to add public access policies. This breaks the public survey form.
--
-- Solution: Add public SELECT for questions and public INSERT for responses

-- 1. Add public read policy for questions of ACTIVE surveys
CREATE POLICY "Public can view questions of active surveys"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = questions.survey_id
        AND surveys.is_active = true
    )
  );

-- 2. Add public insert policy for responses (so participants can submit)
CREATE POLICY "Public can submit responses to active surveys"
  ON responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = responses.survey_id
        AND surveys.is_active = true
    )
  );

-- Note:
-- - surveys already has "Public can read active surveys" policy from migration 01
-- - Admin policies from migration 02 remain in place for full CRUD access
-- - These policies work together: public gets read/insert access, admins get full access
