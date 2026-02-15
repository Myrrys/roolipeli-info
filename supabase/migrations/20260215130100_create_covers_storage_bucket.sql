-- Create covers Storage bucket with RLS policies
-- Spec: specs/entity-cover/spec.md → ROO-72
--
-- Public read, admin-only write. 5MB limit, images only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Anyone can view covers (public bucket)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

-- Admin insert access
CREATE POLICY "Admin insert access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin update access
CREATE POLICY "Admin update access" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'covers'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin delete access
CREATE POLICY "Admin delete access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
