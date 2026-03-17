
CREATE TABLE public.scheduled_update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at timestamp with time zone NOT NULL DEFAULT now(),
  schedule_ids uuid[] DEFAULT '{}',
  page_ids text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'success',
  total_ms integer,
  apis_processed integer DEFAULT 0,
  results jsonb DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_update_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scheduled_update_logs" ON public.scheduled_update_logs
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert scheduled_update_logs" ON public.scheduled_update_logs
  FOR INSERT WITH CHECK (true);
