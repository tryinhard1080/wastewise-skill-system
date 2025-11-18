-- Fix storage RLS policy to prevent cross-user access
-- SECURITY FIX: Previous policy allowed any authenticated user to read any file

-- Drop existing insecure policy
DROP POLICY IF EXISTS "Users can read own project files" ON storage.objects;

-- Create secure policy with proper ownership check
CREATE POLICY "Users can read own project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
    AND projects.user_id = auth.uid()
  )
);

-- Also fix upload policy to verify project ownership
DROP POLICY IF EXISTS "Users can upload to own projects" ON storage.objects;

CREATE POLICY "Users can upload to own projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = 'reports' AND
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
    AND projects.user_id = auth.uid()
  )
);

-- Add policy for file deletion (users can delete their own project files)
CREATE POLICY "Users can delete own project files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1
    FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
    AND projects.user_id = auth.uid()
  )
);
