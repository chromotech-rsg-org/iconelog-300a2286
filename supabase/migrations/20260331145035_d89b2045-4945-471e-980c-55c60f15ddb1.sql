
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid <> pg_backend_pid() 
  AND state IN ('idle in transaction', 'idle in transaction (aborted)')
  AND query_start < now() - interval '30 seconds';

ALTER ROLE anon SET statement_timeout = '30s';
ALTER ROLE authenticated SET statement_timeout = '30s';
