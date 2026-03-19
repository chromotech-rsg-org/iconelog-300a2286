
ALTER TABLE public.scheduled_update_logs 
  ADD COLUMN IF NOT EXISTS trigger_type TEXT NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS triggered_by UUID,
  ADD COLUMN IF NOT EXISTS trigger_details JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.scheduled_update_logs.trigger_type IS 'scheduled or manual';
COMMENT ON COLUMN public.scheduled_update_logs.triggered_by IS 'user_id for manual triggers';
COMMENT ON COLUMN public.scheduled_update_logs.trigger_details IS 'JSON with schedule rule info or manual context';
