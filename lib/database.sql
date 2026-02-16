-- ============================================
-- ORENDT STUDIOS – Mitarbeiter-Umfrage
-- Supabase Database Setup
-- ============================================

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'rating', 'text')),
  category TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL,
  subtitle TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  rating_items JSONB DEFAULT '[]'::jsonb,
  placeholder TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Responses Table
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster sorting
CREATE INDEX IF NOT EXISTS idx_questions_sort ON questions(sort_order);
CREATE INDEX IF NOT EXISTS idx_responses_date ON responses(submitted_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Seed: Default Questions
-- ============================================

INSERT INTO questions (type, category, question, options, sort_order, is_required) VALUES
(
  'single',
  'ARBEITSBEREICH',
  'In welchem Bereich arbeitest du hauptsächlich?',
  '["Wareneingang / Sample Management", "Set-Vorbereitung / Styling", "Studio / Shooting", "Post-Production / Retusche", "Rückversand / Logistik", "Übergreifend / Koordination"]',
  1,
  true
),
(
  'single',
  'ERFAHRUNG',
  'Wie lange arbeitest du bereits bei Orendt Studios?',
  '["Weniger als 6 Monate", "6 Monate – 1 Jahr", "1 – 3 Jahre", "Mehr als 3 Jahre"]',
  2,
  true
),
(
  'multiple',
  'ZEITFRESSER',
  'Bei welchen Arbeitsschritten verlierst du am meisten Zeit?',
  '["Samples suchen / identifizieren", "Auf Informationen warten", "Manuelle Dateneingabe (Excel, Listen)", "Abstimmung mit anderen Abteilungen", "Fehlerhafte / fehlende Lieferungen klären", "Rückversand vorbereiten & koordinieren", "Priorisierung der Aufträge"]',
  3,
  true
),
(
  'rating',
  'BEWERTUNG',
  'Wie bewertest du die folgenden Bereiche?',
  '[]',
  4,
  false
),
(
  'single',
  'KOMMUNIKATION',
  'Wie erfährst du meistens, was als nächstes zu tun ist?',
  '["Mündlich / Zuruf", "E-Mail", "WhatsApp / Messenger", "Digitales System (z.B. CreativeForce)", "Ausgedruckte Listen / Zettel", "Ich muss selbst nachfragen"]',
  5,
  true
),
(
  'single',
  'FRUSTRATION',
  'Was nervt dich im Arbeitsalltag am meisten?',
  '["Unklare Zuständigkeiten", "Fehlende oder veraltete Informationen", "Zu viele manuelle Schritte", "Samples die nicht auffindbar sind", "Ständig wechselnde Prioritäten", "Mangelnde Kommunikation"]',
  6,
  true
),
(
  'text',
  'DEINE IDEE',
  'Wenn du einen Prozess sofort ändern könntest – welcher wäre es und warum?',
  '[]',
  7,
  false
),
(
  'text',
  'FEEDBACK',
  'Gibt es noch etwas, das du uns mitteilen möchtest?',
  '[]',
  8,
  false
);

-- Update rating question with items
UPDATE questions
SET
  subtitle = '1 = sehr schlecht, 5 = sehr gut',
  rating_items = '["Klarheit der Aufgabenverteilung", "Verfügbarkeit von Informationen", "Kommunikation zwischen Teams", "Zustand der Tools/Software", "Übersicht über Sample-Standorte"]'
WHERE category = 'BEWERTUNG';

-- Update text questions with placeholders
UPDATE questions SET placeholder = 'Beschreibe hier, was du ändern würdest...' WHERE category = 'DEINE IDEE';
UPDATE questions SET placeholder = 'Dein zusätzliches Feedback...' WHERE category = 'FEEDBACK';

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Public can read questions
CREATE POLICY "Public can read questions"
  ON questions FOR SELECT
  USING (true);

-- Public can insert responses (anonymous)
CREATE POLICY "Public can insert responses"
  ON responses FOR INSERT
  WITH CHECK (true);

-- Authenticated/service role can do everything
CREATE POLICY "Service role full access questions"
  ON questions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access responses"
  ON responses FOR ALL
  USING (true);
