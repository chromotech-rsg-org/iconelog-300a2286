ALTER TABLE public.admin_permissions DROP CONSTRAINT admin_permissions_permission_type_check;
ALTER TABLE public.admin_permissions ADD CONSTRAINT admin_permissions_permission_type_check 
CHECK (permission_type = ANY (ARRAY[
  'usuarios'::text, 'perfis'::text, 'acesso_publico'::text, 'painel_controle'::text, 
  'cadastro_cidades'::text, 'configurar_bi'::text, 'empresas_clientes'::text, 
  'integracao'::text, 'produtos_estoque'::text, 'testes_api'::text, 'logs_api'::text, 'dados_api'::text
]));