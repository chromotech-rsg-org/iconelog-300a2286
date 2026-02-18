ALTER TABLE public.bi_settings ADD COLUMN slug text;

-- Set default slugs based on page_id
UPDATE public.bi_settings SET slug = page_id WHERE page_id != 'system';