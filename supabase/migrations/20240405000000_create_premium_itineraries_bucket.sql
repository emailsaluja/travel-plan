-- Create the premium_itineraries storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('premium_itineraries', 'premium_itineraries', true);

-- Allow public access to view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium_itineraries');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'premium_itineraries'
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'premium_itineraries'
    AND owner = auth.uid()
)
WITH CHECK (
    bucket_id = 'premium_itineraries'
    AND owner = auth.uid()
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'premium_itineraries'
    AND owner = auth.uid()
); 