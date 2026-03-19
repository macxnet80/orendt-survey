-- Optional password protection for surveys
-- Run this in the Supabase SQL Editor
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL;
