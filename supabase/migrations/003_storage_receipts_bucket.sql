-- ============================================================
-- Storage bucket + RLS policies for receipt uploads
-- ============================================================

-- Create private bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload files only under their own folder: {auth.uid()}/...
CREATE POLICY "receipts_storage_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read only their own receipt images
CREATE POLICY "receipts_storage_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update only their own receipt images
CREATE POLICY "receipts_storage_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete only their own receipt images
CREATE POLICY "receipts_storage_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
