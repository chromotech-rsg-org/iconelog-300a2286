-- Criar role Desenvolvedor se não existir
INSERT INTO public.roles (id, nome, descricao)
VALUES ('00000000-0000-0000-0000-000000000002', 'Desenvolvedor', 'Desenvolvedor com acesso total ao sistema')
ON CONFLICT (id) DO NOTHING;

-- Criar permissões de página para Desenvolvedor (todas as páginas)
INSERT INTO public.page_permissions (role_id, page_id, visualizar, exportar, atualizar, apenas_dev)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'minutas', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'estoque', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'entregas', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'tracking', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'estoque-consolidado', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'faturamento', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'analitico', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'admin', true, true, true, true)
ON CONFLICT DO NOTHING;

-- Criar permissões administrativas completas para Desenvolvedor
INSERT INTO public.admin_permissions (role_id, permission_type, ver, editar, criar, excluir)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'usuarios', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'perfis', true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'acesso_publico', true, true, false, false)
ON CONFLICT DO NOTHING;