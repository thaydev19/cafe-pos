-- ============================================================================
-- Supabase Storage Setup for QuickOne Cafe & Bakery
-- Bucket: menu-items (Public bucket for product photos - No strict 5MB limit)
-- ============================================================================

-- 1. Create the public bucket if it does not already exist (No small file size limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-items',
  'menu-items',
  true,
  52428800, -- 50MB limit (Supports high-res smartphone camera photos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop existing policies to prevent duplicates
DROP POLICY IF EXISTS "Public menu items images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload menu items images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update menu items images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete menu items images" ON storage.objects;

-- 3. Policy: Allow public read access to all images in 'menu-items'
CREATE POLICY "Public menu items images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-items');

-- 4. Policy: Allow authenticated & anon users to upload to 'menu-items'
CREATE POLICY "Anyone can upload menu items images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-items');

-- 5. Policy: Allow updates/overwrites
CREATE POLICY "Anyone can update menu items images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-items');

-- 6. Policy: Allow deletes
CREATE POLICY "Anyone can delete menu items images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-items');

-- 7. Table for tracking orphaned/replaced images with 7-Day Grace Period
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL DEFAULT 'menu-items',
  file_path TEXT NOT NULL,
  file_url TEXT,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purge_after TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'purged', 'reused'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy background query
CREATE INDEX IF NOT EXISTS idx_cleanup_queue_status_purge ON public.storage_cleanup_queue (status, purge_after);

-- RLS Policy: Allow app access to queue
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to storage_cleanup_queue" ON public.storage_cleanup_queue;
CREATE POLICY "Public access to storage_cleanup_queue"
ON public.storage_cleanup_queue FOR ALL
USING (true)
WITH CHECK (true);

