
-- 1. Attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Insert missing profile for alexandre@rsggroup.com.br
INSERT INTO public.profiles (id, nome, email, ativo, is_developer)
VALUES ('05eacb34-96bb-413b-b9e3-d9ad61a85354', 'RSG Group', 'alexandre@rsggroup.com.br', true, false)
ON CONFLICT (id) DO NOTHING;
