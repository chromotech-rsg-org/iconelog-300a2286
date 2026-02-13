
-- Table to cache API data for fast initial load
CREATE TABLE public.bi_data_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id text NOT NULL,
  cache_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  cached_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_id, cache_key)
);

ALTER TABLE public.bi_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view cache"
ON public.bi_data_cache FOR SELECT
USING (true);

CREATE POLICY "Authenticated can upsert cache"
ON public.bi_data_cache FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
