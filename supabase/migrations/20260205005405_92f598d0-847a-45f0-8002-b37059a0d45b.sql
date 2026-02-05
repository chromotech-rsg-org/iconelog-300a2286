-- Create storage bucket for BI logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('bi-assets', 'bi-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Anyone can view bi-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'bi-assets');

CREATE POLICY "Developers can upload bi-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bi-assets' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_developer = true
  )
);

CREATE POLICY "Developers can update bi-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bi-assets' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_developer = true
  )
);

CREATE POLICY "Developers can delete bi-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bi-assets' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_developer = true
  )
);

-- Create table for BI settings (logos, names)
CREATE TABLE public.bi_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bi_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (needed for displaying logos/names)
CREATE POLICY "Anyone can view bi_settings"
ON public.bi_settings FOR SELECT
USING (true);

-- Only developers can manage settings
CREATE POLICY "Developers can manage bi_settings"
ON public.bi_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_developer = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_bi_settings_updated_at
BEFORE UPDATE ON public.bi_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for all pages
INSERT INTO public.bi_settings (page_id, display_name) VALUES
  ('minutas', 'Minutas Expedidas x Baixadas'),
  ('estoque', 'B-Side Estoque'),
  ('entregas', 'B-Side Entregas'),
  ('tracking', 'Tracking Consolidado'),
  ('estoque-consolidado', 'Estoque Consolidado'),
  ('faturamento', 'Faturamento'),
  ('analitico', 'Analítico')
ON CONFLICT (page_id) DO NOTHING;