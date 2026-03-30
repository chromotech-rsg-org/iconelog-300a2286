

## Problema Diagnosticado

O banco de dados do projeto está com **timeout de conexão** — todas as requisições REST falham. Isso afeta tanto o preview quanto a produção. O login fica preso em "Entrando..." porque após autenticar, o sistema tenta carregar o perfil do usuário (`fetchProfile`) que nunca retorna.

## Causa Raiz

A instância do banco de dados pode estar sobrecarregada ou com recursos insuficientes. Isso causa timeouts em cascata em todas as funcionalidades.

## Ação Imediata (Infraestrutura)

Acesse **Cloud → Overview → Advanced settings** e aumente o tamanho da instância do banco de dados. Aguarde 2-3 minutos para normalizar.

## Melhoria no Código (Resiliência do Login)

### Arquivo: `src/hooks/useSupabaseAuth.ts`

**Problema**: O `signIn` chama `fetchProfile` após autenticação, que tem retentativas de até 3x com delays progressivos (2s, 4s, 6s). Se o banco está fora, o usuário fica ~12 segundos preso, sem feedback.

**Solução**: Adicionar um timeout no `signIn` para o `fetchProfile`. Se falhar, ainda assim completar o login (o `onAuthStateChange` cuidará de carregar os dados quando o banco voltar).

```typescript
// No signIn, adicionar timeout para fetchProfile
const signIn = useCallback(async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) { ... }

  if (data.user) {
    try {
      // Timeout de 5s para verificação de perfil ativo
      const profilePromise = fetchProfile(data.user.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("timeout")), 5000)
      );
      const profileData = await Promise.race([profilePromise, timeoutPromise]);
      
      if (profileData && !profileData.ativo) {
        await supabase.auth.signOut();
        return { success: false, message: "Usuário inativo." };
      }
    } catch {
      // Se timeout, prosseguir com login - dados carregarão via onAuthStateChange
      console.warn("Profile check timed out, proceeding with login");
    }
  }

  return { success: true, message: "Login realizado com sucesso!" };
});
```

### Arquivo: `src/hooks/useSupabaseAuth.ts` - fetchProfile

Reduzir retentativas no contexto de login de 3 para 1, para não bloquear o fluxo por muito tempo.

## Resumo

1. **Infraestrutura**: Aumentar instância do banco (ação do usuário no Cloud)
2. **Código**: Adicionar timeout de 5s no fetchProfile durante login, para que o usuário não fique preso infinitamente quando o banco está lento/fora

