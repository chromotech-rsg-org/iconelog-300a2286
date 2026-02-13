
-- 1. Drop existing constraint on admin_permissions and add new one with expanded types
ALTER TABLE public.admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_permission_type_check;
ALTER TABLE public.admin_permissions ADD CONSTRAINT admin_permissions_permission_type_check 
  CHECK (permission_type = ANY (ARRAY['usuarios', 'perfis', 'acesso_publico', 'painel_controle', 'cadastro_cidades', 'configurar_bi', 'empresas_clientes', 'integracao', 'testes_api', 'logs_api']));

-- 2. Add cod_cli and company_name to bi_settings
ALTER TABLE public.bi_settings ADD COLUMN IF NOT EXISTS cod_cli text;
ALTER TABLE public.bi_settings ADD COLUMN IF NOT EXISTS company_name text;

-- 3. Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cod_cli text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL USING (has_admin_permission(auth.uid(), 'empresas_clientes', 'editar'));

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create api_integrations table
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  base_url text,
  auth_type text NOT NULL DEFAULT 'bearer',
  auth_token text,
  headers_json jsonb DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api_integrations" ON public.api_integrations FOR SELECT USING (has_admin_permission(auth.uid(), 'integracao', 'ver'));
CREATE POLICY "Admins can manage api_integrations" ON public.api_integrations FOR ALL USING (has_admin_permission(auth.uid(), 'integracao', 'editar'));

CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON public.api_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create api_test_logs table
CREATE TABLE public.api_test_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'POST',
  request_headers jsonb DEFAULT '{}',
  request_body jsonb,
  response_status integer,
  response_headers jsonb DEFAULT '{}',
  response_body jsonb,
  execution_time_ms integer,
  user_id UUID REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.api_test_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test logs" ON public.api_test_logs FOR SELECT USING (auth.uid() = user_id OR has_admin_permission(auth.uid(), 'logs_api', 'ver'));
CREATE POLICY "Users can insert test logs" ON public.api_test_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage test logs" ON public.api_test_logs FOR ALL USING (has_admin_permission(auth.uid(), 'logs_api', 'editar'));

-- 6. Create stock_kit_config table
CREATE TABLE public.stock_kit_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_code text NOT NULL,
  sku_name text,
  kit_quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_kit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view stock_kit_config" ON public.stock_kit_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage stock_kit_config" ON public.stock_kit_config FOR ALL USING (has_admin_permission(auth.uid(), 'configurar_bi', 'editar'));

CREATE TRIGGER update_stock_kit_config_updated_at BEFORE UPDATE ON public.stock_kit_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create stock_product_whitelist table
CREATE TABLE public.stock_product_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code text NOT NULL UNIQUE,
  product_name text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_product_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view stock_product_whitelist" ON public.stock_product_whitelist FOR SELECT USING (true);
CREATE POLICY "Admins can manage stock_product_whitelist" ON public.stock_product_whitelist FOR ALL USING (has_admin_permission(auth.uid(), 'configurar_bi', 'editar'));

-- 8. Create bi_chart_config table
CREATE TABLE public.bi_chart_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bi_page_id text NOT NULL,
  chart_position text NOT NULL DEFAULT 'left',
  chart_type text NOT NULL DEFAULT 'bar',
  api_endpoint text,
  field_mappings jsonb DEFAULT '{}',
  filters jsonb DEFAULT '{}',
  aggregation_type text DEFAULT 'count',
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.bi_chart_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view bi_chart_config" ON public.bi_chart_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage bi_chart_config" ON public.bi_chart_config FOR ALL USING (has_admin_permission(auth.uid(), 'configurar_bi', 'editar'));

CREATE TRIGGER update_bi_chart_config_updated_at BEFORE UPDATE ON public.bi_chart_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Seed clients data
INSERT INTO public.clients (cod_cli, nome, descricao) VALUES
  ('PAY', 'EPAY', 'EPAY Pagamentos'),
  ('099', '99 FOOD', '99 Food Delivery'),
  ('ICO', 'ICONE LOG GERAL', 'Icone Logística Geral'),
  ('COR', 'ICONE LOG CORR', 'Icone Logística Correios'),
  ('IFD', 'IFOOD', 'iFood'),
  ('ABR', 'ABRAHAO', 'Abrahão'),
  ('COL', 'COLOMBO', 'Colombo'),
  ('ALI', 'ALINEA MKT', 'Alínea Marketing'),
  ('LOG', 'LOGCOMEX', 'Logcomex'),
  ('SHO', 'SHOPEE', 'Shopee'),
  ('RAP', 'RAPPI', 'Rappi'),
  ('ZAP', 'ZAP COMMERCE', 'Zap Commerce');
