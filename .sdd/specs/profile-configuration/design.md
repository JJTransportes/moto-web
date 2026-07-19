# Profile Configuration — Design Técnico

## Visão Geral
Adicionar exibição de foto de perfil de usuários (motoristas e passageiros) na aplicação web, consumindo o endpoint `GET /users/{id}/profile` fornecido pelo backend.

## 1. Componente Compartilhado: `UserAvatar`

Criar um componente reutilizável `UserAvatar` que exibe a foto de perfil ou um fallback.

### Props
```ts
interface UserAvatarProps {
  photoUrl: string | null | undefined
  fullName: string
  size?: 'sm' | 'md' | 'lg' // 32px, 64px, 96px
  className?: string
}
```

### Comportamento
- Se `photoUrl` for uma string válida → exibir `<img>` com a URL, bordas arredondadas (`rounded-full`).
- Se `photoUrl` for `null`/`undefined` → exibir as iniciais do nome em um círculo com fundo colorido (derivado do nome).
- Tratar erro de carregamento da imagem (`onError`) → fallback para iniciais.

### Localização
`src/components/UserAvatar.tsx`

## 2. API: `fetchUserProfilePhoto`

Criar função no `src/api/userApi.ts` para consumir o endpoint.

```ts
interface UserProfilePhoto {
  photoUrl: string | null
}

type UserProfilePhotoResult =
  | { ok: true; data: UserProfilePhoto }
  | { ok: false; status: number; message: string }

async function fetchUserProfilePhoto(
  token: string,
  userId: string,
): Promise<UserProfilePhotoResult>
```

Endpoint: `GET /api/users/{userId}/profile`

## 3. Integrações

### 3.1 UsersPage (lista de usuários)
- Adicionar coluna de avatar na tabela, antes do nome.
- Como a lista paginada (`listDrivers`/`listPassengers`) não retorna `photoUrl`, será necessário disparar uma chamada individual para cada usuário visível OU solicitar ao backend que adicione o campo na resposta paginada.
- **Decisão**: Inicialmente, fazer chamadas individuais apenas para os itens visíveis (primeira página). Após confirmação, o backend pode adicionar `photoUrl` no DTO de listagem.

### 3.2 DriverDetailPage
- Adicionar `UserAvatar` no cabeçalho, ao lado do nome.
- Carregar `photoUrl` via `fetchUserProfilePhoto(userId)` junto com o perfil.
- Exibir o avatar em tamanho `lg` (96px).

### 3.3 PassengerDetailPage
- Mesmo comportamento do DriverDetailPage.
- Adicionar `UserAvatar` no cabeçalho, ao lado do nome.
- Carregar `photoUrl` via `fetchUserProfilePhoto(userId)` junto com o perfil.

## 4. Fluxo de Dados

```
UsersPage / DriverDetailPage / PassengerDetailPage
  ↓
useEffect → fetchUserProfilePhoto(token, userId)
  ↓
{ photoUrl: string | null }
  ↓
UserAvatar component
  ↓
<img> (se photoUrl) | <initials> (fallback)
```

## 5. Tratamento de Erros
- Falha ao carregar a imagem (`onError` no `<img>`) → fallback para iniciais.
- Falha na requisição HTTP (`fetchUserProfilePhoto` retorna erro) → exibir apenas fallback de iniciais (sem blocking error).

## 6. Estrutura de Arquivos Modificados
- `src/api/userApi.ts` — nova função `fetchUserProfilePhoto`
- `src/components/UserAvatar.tsx` — novo componente
- `src/pages/UsersPage.tsx` — adicionar avatar na tabela
- `src/pages/DriverDetailPage.tsx` — adicionar avatar no cabeçalho
- `src/pages/PassengerDetailPage.tsx` — adicionar avatar no cabeçalho
