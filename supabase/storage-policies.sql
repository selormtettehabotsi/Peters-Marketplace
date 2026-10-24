-- ================================================
-- St. Peter's Marketplace — Storage Policies
--
-- First create three PUBLIC buckets in the Supabase dashboard:
--   product-images, product-videos, avatars
-- Then run this file in the SQL Editor.
--
-- Upload paths are {user_id}/{product_id}/{filename}, so
-- (storage.foldername(name))[1] is the owner's user id.
-- ================================================

-- ---- PRODUCT IMAGES ----
CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ---- PRODUCT VIDEOS ----
CREATE POLICY "Product videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-videos');

CREATE POLICY "Authenticated users can upload product videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own product videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ---- AVATARS ----
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
