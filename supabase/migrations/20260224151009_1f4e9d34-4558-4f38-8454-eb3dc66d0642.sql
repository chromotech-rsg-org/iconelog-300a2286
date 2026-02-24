-- Allow authenticated admin users to upload to bi-assets bucket
CREATE POLICY "Admins can upload bi-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bi-assets'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_developer = true)
    OR has_admin_permission(auth.uid(), 'empresas_clientes', 'editar')
    OR has_admin_permission(auth.uid(), 'configurar_bi', 'editar')
  )
);

-- Allow authenticated admin users to update files in bi-assets bucket
CREATE POLICY "Admins can update bi-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bi-assets'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_developer = true)
    OR has_admin_permission(auth.uid(), 'empresas_clientes', 'editar')
    OR has_admin_permission(auth.uid(), 'configurar_bi', 'editar')
  )
);

-- Allow authenticated admin users to delete files in bi-assets bucket  
CREATE POLICY "Admins can delete bi-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bi-assets'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_developer = true)
    OR has_admin_permission(auth.uid(), 'empresas_clientes', 'editar')
    OR has_admin_permission(auth.uid(), 'configurar_bi', 'editar')
  )
);