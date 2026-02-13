
-- Add refresh interval and scheduled updates columns to bi_settings
ALTER TABLE public.bi_settings 
ADD COLUMN IF NOT EXISTS refresh_interval_minutes integer NOT NULL DEFAULT 30;

-- Add export and refresh permissions to public_page_settings
ALTER TABLE public.public_page_settings 
ADD COLUMN IF NOT EXISTS allow_export boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_refresh boolean NOT NULL DEFAULT false;

-- Create table for scheduled automatic updates
CREATE TABLE public.bi_scheduled_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id text NOT NULL,
  update_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bi_scheduled_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view schedules
CREATE POLICY "Anyone can view bi_scheduled_updates"
ON public.bi_scheduled_updates
FOR SELECT
USING (true);

-- Admins can manage schedules
CREATE POLICY "Admins can manage bi_scheduled_updates"
ON public.bi_scheduled_updates
FOR ALL
USING (has_admin_permission(auth.uid(), 'configurar_bi'::text, 'editar'::text));

-- Unique constraint to avoid duplicate times per page
ALTER TABLE public.bi_scheduled_updates 
ADD CONSTRAINT unique_page_time UNIQUE (page_id, update_time);
