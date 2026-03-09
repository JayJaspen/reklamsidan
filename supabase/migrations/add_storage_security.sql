-- ============================================================
-- MIGRATION: Säkra filuppladdning i Supabase Storage
-- Kör i Supabase: Project → SQL Editor → New query → klistra in → Run
-- ============================================================

SET search_path TO public, storage;

-- Tillåt bara godkända MIME-typer i ads-bucketen
-- (detta körs på serversidan och kan inte kringgås från webbläsaren)

DROP POLICY IF EXISTS "Companies can upload ads" ON storage.objects;
CREATE POLICY "Companies can upload ads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ads'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND metadata->>'mimetype' IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'video/mp4'
    )
    AND (metadata->>'size')::int <= 20971520  -- 20 MB
  );

DROP POLICY IF EXISTS "Companies can update own ads" ON storage.objects;
CREATE POLICY "Companies can update own ads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'ads'
    AND metadata->>'mimetype' IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'video/mp4'
    )
    AND (metadata->>'size')::int <= 20971520
  );

DROP POLICY IF EXISTS "Companies can delete own ads" ON storage.objects;
CREATE POLICY "Companies can delete own ads"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Public can read ads" ON storage.objects;
CREATE POLICY "Public can read ads"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ads');
