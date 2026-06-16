-- VozZap Storage Bucket Setup

-- 1. Create or ensure audios bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('audios', 'audios', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read audios" ON storage.objects;
DROP POLICY IF EXISTS "User upload audio" ON storage.objects;
DROP POLICY IF EXISTS "User delete audio" ON storage.objects;

-- 3. Create new policies

-- Allow anyone to read audio files
CREATE POLICY "Public read audios" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'audios');

-- Allow authenticated users to upload audio files to their folder
CREATE POLICY "User upload audio" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audios' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own audio files
CREATE POLICY "User delete audio" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audios'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
