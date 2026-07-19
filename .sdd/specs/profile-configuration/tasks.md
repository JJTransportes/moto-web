# Profile Configuration — Tasks

## Tarefas de Implementação

### T1: Criar componente UserAvatar
- **Arquivo**: `src/components/UserAvatar.tsx`
- **Descrição**: Componente reutilizável que exibe foto de perfil ou fallback com iniciais.
- **Detalhes**:
  - Props: `photoUrl`, `fullName`, `size` ('sm' | 'md' | 'lg'), `className?`
  - Tamanhos: sm=32px, md=64px, lg=96px
  - Fallback: iniciais (primeiro nome + último nome) em círculo colorido
  - Cor de fundo: derivada do hash do nome (paleta fixa de ~8 cores)
  - Tratamento de erro de imagem (`onError` → esconde img, mostra fallback)

### T2: Adicionar função fetchUserProfilePhoto na API
- **Arquivo**: `src/api/userApi.ts`
- **Descrição**: Função para consumir `GET /api/users/{userId}/profile`.
- **Detalhes**:
  - Tipo de retorno: `UserProfilePhotoResult` com `{ photoUrl: string | null }`
  - Tratamento de erro padrão (404, outros)

### T3: Integrar foto na DriverDetailPage
- **Arquivo**: `src/pages/DriverDetailPage.tsx`
- **Descrição**: Adicionar `UserAvatar` no cabeçalho da página de detalhes do motorista.
- **Detalhes**:
  - Carregar `photoUrl` paralelamente ao perfil (ou em sequência)
  - Exibir avatar tamanho `lg` ao lado do nome
  - Fallback para iniciais se não houver foto

### T4: Integrar foto na PassengerDetailPage
- **Arquivo**: `src/pages/PassengerDetailPage.tsx`
- **Descrição**: Adicionar `UserAvatar` no cabeçalho da página de detalhes do passageiro.
- **Detalhes**:
  - Mesmo padrão da DriverDetailPage
  - Exibir avatar tamanho `lg` ao lado do nome

### T5: Integrar foto na UsersPage (lista)
- **Arquivo**: `src/pages/UsersPage.tsx`
- **Descrição**: Adicionar avatar na tabela de listagem de usuários.
- **Detalhes**:
  - Adicionar coluna de avatar antes do nome
  - Para cada item visível, disparar `fetchUserProfilePhoto` e armazenar em mapa `Map<string, string|null>`
  - Exibir avatar tamanho `sm` (32px)
  - Gerenciar loading state para cada avatar individualmente

### T6: Adicionar testes
- **Arquivos**: `src/__tests__/UserAvatar.test.tsx`
- **Descrição**: Testes unitários para o componente UserAvatar.
- **Detalhes**:
  - Renderizar com photoUrl → verificar `<img>` com src correto
  - Renderizar sem photoUrl → verificar fallback com iniciais
  - Simular erro de imagem → verificar fallback
  - Verificar tamanhos diferentes (sm, md, lg)
