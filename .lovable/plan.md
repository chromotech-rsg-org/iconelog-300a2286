
Objetivo: corrigir de forma definitiva a perda recorrente do perfil de Desenvolvedor e estabilizar a troca de login/email e senha no painel de usuários.

Diagnóstico confirmado
1) O usuário desenvolvedor (dev@iconelog.com) está sem vínculo em `user_roles` no banco (perfil realmente removido).
2) A causa raiz está no fluxo de edição de usuário:
- `src/pages/Admin.tsx` sempre envia `role_id` ao salvar, mesmo sem mudança de perfil.
- `src/hooks/useUsersManagement.ts` faz `delete` + `insert` em `user_roles`.
- Quando o próprio desenvolvedor edita a própria conta, o `delete` remove a role que dava permissão e o `insert` seguinte pode falhar por RLS, deixando o usuário sem perfil.
3) O modal fecha mesmo com erro (falha silenciosa para o operador).
4) A função de backend `update-user-auth` está frágil na autenticação manual (`getClaims`), com histórico de “Auth session missing” em logs, o que contribui para erros 401/“non-2xx”.

Implementação proposta (sequência)
1. Correção imediata de dados (desbloqueio)
- Recriar o vínculo do desenvolvedor com a role `Desenvolvedor` em `user_roles` (upsert seguro).
- Validar que `dev@iconelog.com` voltou a ter role.

2. Corrigir o fluxo de salvar usuário no frontend
- Arquivo: `src/pages/Admin.tsx`
- Ajustes:
  - Só enviar `role_id` para atualização quando houver mudança real de perfil.
  - Não fechar o modal se `updateUser` falhar.
  - Interromper o fluxo de troca de credenciais quando a etapa de atualização do usuário falhar.
  - Melhorar feedback de erro para exibir causa real quando backend retornar não-2xx.

3. Blindar atualização de role para não perder permissão no meio da operação
- Arquivo: `src/hooks/useUsersManagement.ts`
- Substituir padrão “delete e depois insert” por fluxo seguro:
  - Buscar vínculo(s) atual(is) do usuário.
  - Se não mudou, não tocar em `user_roles`.
  - Se mudou, atualizar vínculo existente (ou inserir quando não existir), sem janela de usuário “sem perfil”.
  - Normalizar múltiplos vínculos legados sem apagar antes de garantir vínculo válido.
  - Tratar e propagar todos os erros (inclusive erro de delete/update/insert).
- Resultado: evita perda de perfil mesmo em cenário de edição do próprio usuário.

4. Estabilizar autenticação/autorização da função de troca de credenciais
- Arquivo: `supabase/functions/update-user-auth/index.ts`
- Ajustes:
  - Trocar validação manual para abordagem consistente com as outras funções do projeto (`auth.getUser(token)`).
  - Manter validação server-side de permissão via `has_admin_permission`.
  - Padronizar respostas 401/403 com mensagem clara.
  - Adicionar logs de diagnóstico objetivos (sem vazar dados sensíveis) para facilitar suporte futuro.

5. Validação funcional completa (fim-a-fim)
- Cenários obrigatórios:
  - Desenvolvedor editar próprio nome/email/senha sem perder role.
  - Desenvolvedor editar outro usuário (nome, status, perfil, email, senha).
  - Usuário sem permissão de `usuarios/editar` receber bloqueio correto.
  - Confirmar que após salvar, menu e acessos permanecem corretos sem “sumir perfil”.
  - Repetir fluxo duas ou três vezes para validar que o problema não reaparece.

Critérios de aceite
- dev@iconelog.com permanece com role Desenvolvedor após alterações de credenciais.
- Troca de email e senha retorna sucesso consistente para usuário autorizado.
- Nenhum salvamento de usuário deixa `user_roles` vazio por efeito colateral.
- Em falhas reais, o operador recebe mensagem clara e o modal não fecha indevidamente.

Se você aprovar, eu implemento exatamente nessa ordem para resolver de vez e deixar o fluxo estável.
