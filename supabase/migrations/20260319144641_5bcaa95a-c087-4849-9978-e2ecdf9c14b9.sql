CREATE TABLE IF NOT EXISTS public.bi_scheduled_update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL,
  page_id TEXT NOT NULL,
  cod_cli TEXT,
  api_integration_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_ms INTEGER,
  records_processed INTEGER NOT NULL DEFAULT 0,
  queue_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bi_scheduled_update_queue ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS bi_scheduled_update_queue_queue_key_unique
  ON public.bi_scheduled_update_queue (queue_key);

CREATE INDEX IF NOT EXISTS bi_scheduled_update_queue_status_available_idx
  ON public.bi_scheduled_update_queue (status, available_at);

CREATE INDEX IF NOT EXISTS bi_scheduled_update_queue_page_id_idx
  ON public.bi_scheduled_update_queue (page_id);

CREATE TRIGGER update_bi_scheduled_update_queue_updated_at
BEFORE UPDATE ON public.bi_scheduled_update_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can view bi_scheduled_update_queue"
ON public.bi_scheduled_update_queue
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage bi_scheduled_update_queue"
ON public.bi_scheduled_update_queue
FOR ALL
USING (true)
WITH CHECK (true);