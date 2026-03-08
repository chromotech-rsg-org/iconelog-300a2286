
-- Add 'tradutor' to admin_permissions permission_type check constraint
ALTER TABLE public.admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_permission_type_check;
ALTER TABLE public.admin_permissions ADD CONSTRAINT admin_permissions_permission_type_check 
  CHECK (permission_type IN ('usuarios', 'perfis', 'acesso_publico', 'painel_controle', 'cadastro_cidades', 'configurar_bi', 'empresas_clientes', 'integracao', 'produtos_estoque', 'testes_api', 'logs_api', 'dados_api', 'tradutor'));

-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language, key)
);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view translations
CREATE POLICY "Anyone authenticated can view translations"
  ON public.translations FOR SELECT
  TO authenticated
  USING (true);

-- Admins with tradutor permission can manage translations
CREATE POLICY "Admins can manage translations"
  ON public.translations FOR ALL
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'tradutor'::text, 'editar'::text))
  WITH CHECK (has_admin_permission(auth.uid(), 'tradutor'::text, 'editar'::text));

-- Add updated_at trigger
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
