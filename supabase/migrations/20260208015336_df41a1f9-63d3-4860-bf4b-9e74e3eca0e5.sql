
-- Create city/regional/UF mapping table
CREATE TABLE public.city_regional_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cidade TEXT NOT NULL,
  regional TEXT NOT NULL,
  uf TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.city_regional_mapping ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view
CREATE POLICY "Anyone authenticated can view city_regional_mapping"
ON public.city_regional_mapping
FOR SELECT
USING (true);

-- Admins with cadastro_cidades permission can manage
CREATE POLICY "Admins can manage city_regional_mapping"
ON public.city_regional_mapping
FOR ALL
USING (has_admin_permission(auth.uid(), 'cadastro_cidades'::text, 'editar'::text));

-- Update the admin_permissions check constraint to include cadastro_cidades
ALTER TABLE public.admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_permission_type_check;

ALTER TABLE public.admin_permissions ADD CONSTRAINT admin_permissions_permission_type_check 
CHECK (permission_type = ANY (ARRAY['usuarios'::text, 'perfis'::text, 'acesso_publico'::text, 'painel_controle'::text, 'cadastro_cidades'::text]));

-- Add trigger for updated_at
CREATE TRIGGER update_city_regional_mapping_updated_at
BEFORE UPDATE ON public.city_regional_mapping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
