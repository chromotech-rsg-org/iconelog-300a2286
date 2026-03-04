-- Expand check constraint to include 'tradutor'
ALTER TABLE admin_permissions DROP CONSTRAINT admin_permissions_permission_type_check;
ALTER TABLE admin_permissions ADD CONSTRAINT admin_permissions_permission_type_check CHECK (permission_type = ANY (ARRAY['usuarios','perfis','acesso_publico','painel_controle','cadastro_cidades','configurar_bi','empresas_clientes','integracao','produtos_estoque','testes_api','logs_api','dados_api','tradutor']));

-- Add 'tradutor' permission for all existing roles
INSERT INTO admin_permissions (role_id, permission_type, ver, editar, criar, excluir, apenas_dev)
SELECT r.id, 'tradutor', false, false, false, false, false
FROM roles r
WHERE NOT EXISTS (
  SELECT 1 FROM admin_permissions ap WHERE ap.role_id = r.id AND ap.permission_type = 'tradutor'
);