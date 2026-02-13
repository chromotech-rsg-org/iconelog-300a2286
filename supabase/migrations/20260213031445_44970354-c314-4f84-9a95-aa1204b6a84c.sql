
-- Table to store last API update timestamps per BI page
CREATE TABLE public.bi_last_update (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id text NOT NULL UNIQUE,
  last_update_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bi_last_update ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bi_last_update"
  ON public.bi_last_update FOR SELECT USING (true);

CREATE POLICY "Authenticated can upsert bi_last_update"
  ON public.bi_last_update FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
