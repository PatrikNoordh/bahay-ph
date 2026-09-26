-- ============================================================
-- BH-18: Storage RLS policies for property-images bucket
-- Bucket is PUBLIC with a 50 MB file size limit (configured in dashboard).
-- These policies control who can write and delete objects.
-- Apply by running this file in the Supabase SQL editor.
-- ============================================================

-- ── READ ─────────────────────────────────────────────────────────────────────
-- The bucket is already set to PUBLIC in the dashboard, which grants anonymous
-- SELECT access automatically. No additional SELECT policy is needed.

-- ── INSERT (upload) ──────────────────────────────────────────────────────────
-- Authenticated agents may upload files only into folders named after a
-- property they own (path format: {property_id}/{filename}).
CREATE POLICY "Agent upload to own property folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text
    FROM properties p
    JOIN agents a ON a.id = p.agent_id
    WHERE a.user_id = auth.uid()
  )
);

-- ── UPDATE ───────────────────────────────────────────────────────────────────
-- Agents may update (replace) only their own objects.
CREATE POLICY "Agent update own property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text
    FROM properties p
    JOIN agents a ON a.id = p.agent_id
    WHERE a.user_id = auth.uid()
  )
);

-- ── DELETE ───────────────────────────────────────────────────────────────────
-- Agents may delete only objects inside their own property folders.
CREATE POLICY "Agent delete own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text
    FROM properties p
    JOIN agents a ON a.id = p.agent_id
    WHERE a.user_id = auth.uid()
  )
);
