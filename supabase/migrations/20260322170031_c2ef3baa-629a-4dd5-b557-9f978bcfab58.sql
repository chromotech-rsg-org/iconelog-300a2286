ALTER TABLE public.stock_product_whitelist
  ADD COLUMN kit_completo boolean NOT NULL DEFAULT true,
  ADD COLUMN kit_basico boolean NOT NULL DEFAULT false;