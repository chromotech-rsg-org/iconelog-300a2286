
# Plano de Ajuste do Sistema de Perfis e Permissoes

## Problemas Identificados

### Problema 1: Perfis nao tem CRUD completo
A tela de Admin mostra os perfis como lista fixa sem opcoes de criar, editar ou deletar. Os perfis estao embutidos no codigo com varios defaults (Gerente, Operador, Visualizador).

### Problema 2: Permissoes nao refletem ao logar
O `AuthContext` usa funcoes que buscam dos dados estaticos (`mockProfiles`, `mockUsers`) em vez dos estados atualizados (`profiles`, `users`). Quando o admin altera permissoes, elas ficam no state React mas as funcoes `getPermission`, `canView`, etc. continuam consultando os dados originais importados.

**Raiz do problema no AuthContext.tsx:**
```text
Linha 57: const profile = user ? getProfileById(user.perfilId) : null;
Linha 78: const permissions = getUserPermissions(user.id);
```
Essas funcoes vem de `authData.ts` e sempre olham `mockProfiles`/`mockUsers`, ignorando as edicoes feitas.

---

## Solucao Proposta

### 1. Refatorar AuthContext para usar estados internos

Modificar o `AuthContext` para que todas as funcoes de permissao consultem os estados `users` e `profiles` em vez dos dados mock importados:

**Alteracoes:**
- Calcular `profile` do usuario atual a partir do state `profiles`
- Criar funcao interna `getProfileByIdFromState` que busca do state
- Criar funcao interna `getUserPermissionsFromState` que busca do state
- Atualizar `getPermission`, `canView`, `canExport`, `canRefresh`, `isDevOnly` para usar os states

### 2. Adicionar CRUD completo de Perfis no Admin

Modificar `Admin.tsx` para incluir:

**Na aba Perfis:**
- Botao "Novo Perfil" que abre dialog para criar perfil
- Cada card de perfil tera botoes Editar (nome) e Excluir
- Dialog de criacao/edicao de perfil com campo nome e matriz de permissoes
- Proteger perfis "Desenvolvedor" e "Administrador" contra exclusao
- Permitir edicao de permissoes inline (ja existe) e edicao do nome do perfil

**Fluxo de CRUD:**
```text
[+Novo Perfil] -> Dialog com:
  - Campo "Nome do Perfil"
  - Matriz de permissoes (todas as paginas com switches)
  - Botao Salvar

[Editar] -> Dialog similar com dados preenchidos
[Excluir] -> Confirmacao + remocao (apenas se nao houver usuarios vinculados)
```

### 3. Simplificar dados mock iniciais

Modificar `authData.ts` para manter apenas:
- Perfil "Desenvolvedor" (oculto)
- Perfil "Administrador"
- Usuario "Desenvolvedor" (oculto)
- Usuario "Administrador"

Remover: Gerente, Operador, Visualizador (usuario cria conforme necessidade)

---

## Secao Tecnica

### Arquivos a Modificar

**src/contexts/AuthContext.tsx**
- Adicionar funcao `getProfileFromState(perfilId)` que busca do state `profiles`
- Atualizar calculo de `profile` para usar state
- Refatorar `getPermission` para:
```typescript
const getPermission = useCallback((pageId: string): PagePermission | null => {
  if (!user) return null;
  const userProfile = profiles.find(p => p.id === user.perfilId);
  if (!userProfile) return null;
  return userProfile.permissoes[pageId] || null;
}, [user, profiles]);
```
- Refatorar `canView`, `canExport`, `canRefresh` para depender de `profiles` e `user`
- Manter sincronizacao: quando usuario logado tem perfil editado, as permissoes atualizam

**src/data/authData.ts**
- Remover perfis: Gerente, Operador, Visualizador
- Remover usuarios: joao.silva, maria.santos
- Manter apenas Desenvolvedor e Administrador

**src/pages/Admin.tsx**
- Adicionar state `isProfileDialogOpen` e `editingProfile`
- Criar dialog para criar/editar perfil com:
  - Input para nome do perfil
  - Matriz de permissoes (switches para cada pagina/acao)
- Adicionar botoes Editar/Excluir em cada card de perfil
- Impedir exclusao de perfis "dev-profile" e "admin-profile"
- Impedir exclusao de perfil que tenha usuarios vinculados
- Mostrar toast de erro se tentar excluir perfil em uso

### Estrutura do Dialog de Perfil

```text
+----------------------------------+
| Novo Perfil / Editar Perfil      |
+----------------------------------+
| Nome: [___________________]      |
|                                  |
| Permissoes:                      |
| +------------------------------+ |
| | Pagina     | Ver | Exp | Atu | |
| +------------------------------+ |
| | Minutas    | [x] | [x] | [x] | |
| | Estoque    | [x] | [ ] | [ ] | |
| | Entregas   | [x] | [ ] | [ ] | |
| | ...        | ... | ... | ... | |
| +------------------------------+ |
|                                  |
|        [Cancelar] [Salvar]       |
+----------------------------------+
```

### Validacoes

1. Nome do perfil obrigatorio
2. Nao pode excluir perfil Desenvolvedor ou Administrador
3. Nao pode excluir perfil com usuarios vinculados
4. Desenvolvedor e perfil Desenvolvedor sempre ocultos de nao-devs

### Fluxo de Verificacao de Permissoes

Apos as mudancas, o fluxo sera:

```text
1. Admin edita permissoes do perfil X
2. State `profiles` e atualizado no AuthContext
3. Usuario logado com perfil X automaticamente ve mudancas
4. Funcoes canView/canExport/canRefresh usam state atualizado
5. Menu de navegacao e header respeitam novas permissoes
```

---

## Resumo de Entregas

| Arquivo | Mudanca |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Refatorar para usar states internos |
| `src/data/authData.ts` | Simplificar para apenas Dev + Admin |
| `src/pages/Admin.tsx` | Adicionar CRUD completo de perfis |

---

## Resultado Esperado

1. **Perfis editaveis**: Criar, editar nome e permissoes, deletar perfis
2. **Permissoes refletem**: Ao alterar permissao de um perfil, usuarios com esse perfil imediatamente veem a mudanca
3. **Dados limpos**: Sistema inicia apenas com Dev (oculto) e Admin, usuario cria demais perfis
4. **Protecao**: Perfis essenciais nao podem ser deletados

