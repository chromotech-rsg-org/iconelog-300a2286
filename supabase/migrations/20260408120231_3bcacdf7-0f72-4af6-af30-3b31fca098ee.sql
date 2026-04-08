-- Delete old-format cache keys (followup_099_YYYY_MM and produtosdistribuidos_099_YYYY_MM)
-- Keep only unified format (followup_YYYY_MM_099 and produtosdistribuidos_YYYY_MM_099)
DELETE FROM bi_data_cache 
WHERE page_id = '_shared' 
AND (
  cache_key ~ '^followup_\d{3}_\d{4}_\d{2}$'
  OR cache_key ~ '^produtosdistribuidos_\d{3}_\d{4}_\d{2}$'
  OR cache_key IN ('followup_099', 'produtosdistribuidos_099')
);

-- Also clean up any pending queue jobs with old month-suffix format
DELETE FROM bi_scheduled_update_queue WHERE status = 'pending' AND queue_key ~ '_\d{4}_\d{2}$';