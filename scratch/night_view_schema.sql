-- CREATE TABLE FOR NIGHT VIDEOS
CREATE TABLE IF NOT EXISTS street_night_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploader_type TEXT NOT NULL CHECK (uploader_type IN ('tenant', 'landlord', 'past_tenant')),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  recorded_at DATE,
  description TEXT,
  upvotes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE street_night_videos ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Anyone can read approved videos"
  ON street_night_videos FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Authenticated users can upload"
  ON street_night_videos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders can delete own videos"
  ON street_night_videos FOR DELETE
  USING (auth.uid() = uploaded_by);

-- STORAGE BUCKET RLS (Run in SQL if you have storage extensions enabled, otherwise use UI)
-- NOTE: Usually handled via Supabase Dashboard -> Storage -> Policies

-- RPC TO INCREMENT UPVOTES
CREATE OR REPLACE FUNCTION increment_video_upvotes(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE street_night_videos
  SET upvotes = upvotes + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER TO BOOST BHOOMI SCORE WHEN NIGHT VIDEO IS ADDED
CREATE OR REPLACE FUNCTION boost_room_bhoomi_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms
  SET bhoomi_score = LEAST(COALESCE(bhoomi_score, 500) + 25, 900)
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_night_video_added ON street_night_videos;
CREATE TRIGGER on_night_video_added
AFTER INSERT ON street_night_videos
FOR EACH ROW
WHEN (NEW.is_approved = TRUE)
EXECUTE FUNCTION boost_room_bhoomi_score();
