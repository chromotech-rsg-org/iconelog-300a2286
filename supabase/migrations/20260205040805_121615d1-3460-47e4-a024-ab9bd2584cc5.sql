-- Drop the old check constraint
ALTER TABLE public.admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_permission_type_check;

-- Add new check constraint including painel_controle
ALTER TABLE public.admin_permissions ADD CONSTRAINT admin_permissions_permission_type_check 
CHECK (permission_type = ANY (ARRAY['usuarios'::text, 'perfis'::text, 'acesso_publico'::text, 'painel_controle'::text]));