-- 1. Allow public uploads to the specific bucket
CREATE POLICY "Allow public upload to phd-tracking-docs"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'phd-tracking-docs');

-- 2. Allow public read access to the specific bucket
CREATE POLICY "Allow public read from phd-tracking-docs"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'phd-tracking-docs');

-- 3. (Optional) Allow public updates/deletes if needed
CREATE POLICY "Allow public update/delete"
ON storage.objects FOR UPDATE, DELETE
TO anon
USING (bucket_id = 'phd-tracking-docs');
