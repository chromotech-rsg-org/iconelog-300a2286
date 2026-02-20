-- Add interval-based scheduling support
ALTER TABLE public.bi_scheduled_updates 
  ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'time',
  ADD COLUMN interval_minutes INTEGER DEFAULT NULL,
  ADD COLUMN last_executed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.bi_scheduled_updates.schedule_type IS 'time = fixed time, interval = every N minutes';
COMMENT ON COLUMN public.bi_scheduled_updates.interval_minutes IS 'Interval in minutes for interval-type schedules';
