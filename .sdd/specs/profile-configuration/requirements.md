# Profile Configuration — Requisitos

## Origem
Integração com o backend (MDriver) que implementou o endpoint `GET /users/{id}/profile` retornando `{ photoUrl: string | null }`. Motoristas e passageiros podem agora editar nome, email, telefone e foto de perfil via opção Configurações no aplicativo mobile. A foto de perfil deve ser exibida também na aplicação web.

## Requisitos Funcionais

### RF1: Exibir foto de perfil na lista de usuários (UsersPage)
- **Descrição**: Na tabela de listagem de motoristas e passageiros, exibir um avatar/foto de perfil ao lado do nome do usuário.
- **Critérios de aceitação**:
  - Se `photoUrl` não for nulo, exibir a imagem em um círculo (avatar) de ~32x32px ao lado do nome.
  - Se `photoUrl` for nulo, exibir um placeholder padrão (iniciais ou ícone de usuário).
  - A foto deve ser carregada da URL pública fornecida pelo backend.
  - Tratar erro de carregamento da imagem (fallback para placeholder).

### RF2: Exibir foto de perfil no detalhe do motorista (DriverDetailPage)
- **Descrição**: Na página de detalhes do motorista, exibir a foto de perfil no cabeçalho, ao lado do nome.
- **Critérios de aceitação**:
  - Exibir a foto em tamanho maior (~80x80px ou 96x96px) no topo da página.
  - Se `photoUrl` for nulo, exibir placeholder com as iniciais do nome ou ícone.
  - Tratar erro de carregamento.

### RF3: Exibir foto de perfil no detalhe do passageiro (PassengerDetailPage)
- **Descrição**: Na página de detalhes do passageiro, exibir a foto de perfil no cabeçalho, ao lado do nome.
- **Critérios de aceitação**:
  - Mesmo comportamento do RF2, adaptado para a página de passageiros.

### RF4: Endpoint de consumo
- **Descrição**: Consumir o endpoint `GET /users/{id}/profile` para obter a `photoUrl`.
- **Critérios de aceitação**:
  - Criar função `fetchUserProfilePhoto` no módulo de API.
  - Retornar `{ photoUrl: string | null }` ou erro.
  - Integrar a chamada nos componentes que exibem a foto.

## Observações
- O endpoint já está implementado no backend (MDriver).
- O campo `photoUrl` pode ser `null` (usuário sem foto).
- As URLs públicas de imagem podem ser de qualquer origem (S3, CloudFront, etc.).
- A implementação deve ser feita apenas no frontend web.
