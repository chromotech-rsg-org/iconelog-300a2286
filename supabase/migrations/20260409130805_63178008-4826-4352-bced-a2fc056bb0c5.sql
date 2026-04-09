-- Create partial index to speed up cache lookups (the most common query pattern)
CREATE INDEX IF NOT EXISTS idx_bi_data_cache_shared_key 
ON bi_data_cache (cache_key) 
WHERE page_id = '_shared';

-- Create index on schedule_id for faster finalization queries
CREATE INDEX IF NOT EXISTS idx_bi_queue_schedule_status
ON bi_scheduled_update_queue (schedule_id, status);

-- Kill stuck/idle connections to free pool
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND state IN ('idle', 'idle in transaction', 'active')
  AND query_start < now() - interval '2 minutes'
  AND backend_type = 'client backend';