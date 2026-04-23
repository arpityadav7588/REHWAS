-- BHOOMI SCORE 2.0 SCHEMA UPDATE

-- Add bhoomi_score column if not present
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS bhoomi_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bhoomi_grade TEXT DEFAULT 'C',
  ADD COLUMN IF NOT EXISTS bhoomi_last_computed TIMESTAMPTZ;

-- Create room_reviews table
CREATE TABLE IF NOT EXISTS room_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  verified_tenant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE room_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Anyone can read reviews" ON room_reviews;
DROP POLICY IF EXISTS "Authenticated users can write reviews" ON room_reviews;

-- Policies
CREATE POLICY "Anyone can read reviews" ON room_reviews FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can write reviews" ON room_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Optional: Function to handle review deletions if needed (skipped for MVP)
