-- 1. Tabela de perfis de usuários (vinculada ao auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  is_developer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de perfis de acesso (roles)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de permissões de páginas por perfil
CREATE TABLE public.page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  visualizar BOOLEAN NOT NULL DEFAULT false,
  exportar BOOLEAN NOT NULL DEFAULT false,
  atualizar BOOLEAN NOT NULL DEFAULT false,
  apenas_dev BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, page_id)
);

-- 4. Tabela de permissões admin por perfil
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('usuarios', 'perfis', 'acesso_publico')),
  ver BOOLEAN NOT NULL DEFAULT false,
  editar BOOLEAN NOT NULL DEFAULT false,
  criar BOOLEAN NOT NULL DEFAULT false,
  excluir BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_type)
);

-- 5. Tabela de configurações de acesso público por página
CREATE TABLE public.public_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de relacionamento usuário-perfil (user_roles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_page_settings_updated_at
  BEFORE UPDATE ON public.public_page_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função helper: pegar role_ids do usuário
CREATE OR REPLACE FUNCTION public.get_user_role_ids(user_uuid UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role_id), '{}')
  FROM user_roles
  WHERE user_id = user_uuid;
$$;

-- Função helper: verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN admin_permissions ap ON ur.role_id = ap.role_id
    WHERE ur.user_id = user_uuid
    AND (ap.ver = true OR ap.editar = true OR ap.criar = true OR ap.excluir = true)
  );
$$;

-- Função helper: verificar permissão admin específica
CREATE OR REPLACE FUNCTION public.has_admin_permission(user_uuid UUID, perm_type TEXT, action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN admin_permissions ap ON ur.role_id = ap.role_id
    WHERE ur.user_id = user_uuid
    AND ap.permission_type = perm_type
    AND (
      (action = 'ver' AND ap.ver = true) OR
      (action = 'editar' AND ap.editar = true) OR
      (action = 'criar' AND ap.criar = true) OR
      (action = 'excluir' AND ap.excluir = true)
    )
  );
$$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_user(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.has_admin_permission(auth.uid(), 'usuarios', 'editar'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.has_admin_permission(auth.uid(), 'usuarios', 'criar'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.has_admin_permission(auth.uid(), 'usuarios', 'excluir'));

-- RLS policies para roles
CREATE POLICY "Anyone authenticated can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  USING (public.has_admin_permission(auth.uid(), 'perfis', 'editar'));

-- RLS policies para page_permissions
CREATE POLICY "Anyone authenticated can view page_permissions"
  ON public.page_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage page_permissions"
  ON public.page_permissions FOR ALL
  USING (public.has_admin_permission(auth.uid(), 'perfis', 'editar'));

-- RLS policies para admin_permissions
CREATE POLICY "Anyone authenticated can view admin_permissions"
  ON public.admin_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage admin_permissions"
  ON public.admin_permissions FOR ALL
  USING (public.has_admin_permission(auth.uid(), 'perfis', 'editar'));

-- RLS policies para public_page_settings
CREATE POLICY "Anyone can view public_page_settings"
  ON public.public_page_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage public_page_settings"
  ON public.public_page_settings FOR ALL
  USING (public.has_admin_permission(auth.uid(), 'acesso_publico', 'editar'));

-- RLS policies para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(), 'usuarios', 'ver'));

CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL
  USING (public.has_admin_permission(auth.uid(), 'usuarios', 'editar'));

-- Trigger para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, ativo, is_developer)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    true,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados iniciais: páginas do sistema
INSERT INTO public.public_page_settings (page_id, is_public) VALUES
  ('minutas', false),
  ('estoque', false),
  ('entregas', false),
  ('tracking', false),
  ('estoque-consolidado', false),
  ('faturamento', false),
  ('analitico', false);

-- Criar perfil Administrador padrão
INSERT INTO public.roles (id, nome, descricao) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Administrador', 'Acesso total ao sistema');

-- Permissões de páginas para Administrador
INSERT INTO public.page_permissions (role_id, page_id, visualizar, exportar, atualizar, apenas_dev) VALUES
  ('00000000-0000-0000-0000-000000000001', 'minutas', true, true, true, false),
  ('00000000-0000-0000-0000-000000000001', 'estoque', true, true, true, false),
  ('00000000-0000-0000-0000-000000000001', 'entregas', true, true, true, false),
  ('00000000-0000-0000-0000-000000000001', 'tracking', true, true, true, false),
  ('00000000-0000-0000-0000-000000000001', 'estoque-consolidado', true, true, true, false),
  ('00000000-0000-0000-0000-000000000001', 'faturamento', true, true, true, false),
  ('00000000-0000-0000-0000-000000000001', 'analitico', true, true, true, false);

-- Permissões admin para Administrador
INSERT INTO public.admin_permissions (role_id, permission_type, ver, editar, criar, excluir) VALUES
  ('00000000-0000-0000-0000-000000000001', 'usuarios', true, true, true, true),
  ('00000000-0000-0000-0000-000000000001', 'perfis', true, true, true, true),
  ('00000000-0000-0000-0000-000000000001', 'acesso_publico', true, true, false, false);