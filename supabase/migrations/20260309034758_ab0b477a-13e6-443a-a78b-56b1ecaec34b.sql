CREATE OR REPLACE FUNCTION public.get_cache_years()
RETURNS SETOF integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT (item->>'_fetch_year')::integer
  FROM public.bi_data_cache, jsonb_array_elements(data) item
  WHERE item->>'_fetch_year' IS NOT NULL
    AND (item->>'_fetch_year')::integer > 2000
  ORDER BY 1;
$$;