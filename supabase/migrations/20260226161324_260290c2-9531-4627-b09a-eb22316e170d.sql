
-- Fix RLS for stock_product_whitelist: use produtos_estoque instead of configurar_bi
DROP POLICY IF EXISTS "Admins can manage stock_product_whitelist" ON public.stock_product_whitelist;
CREATE POLICY "Admins can manage stock_product_whitelist"
  ON public.stock_product_whitelist FOR ALL
  USING (has_admin_permission(auth.uid(), 'produtos_estoque'::text, 'editar'::text));

-- Fix RLS for stock_kit_config: use produtos_estoque instead of configurar_bi
DROP POLICY IF EXISTS "Admins can manage stock_kit_config" ON public.stock_kit_config;
CREATE POLICY "Admins can manage stock_kit_config"
  ON public.stock_kit_config FOR ALL
  USING (has_admin_permission(auth.uid(), 'produtos_estoque'::text, 'editar'::text));
