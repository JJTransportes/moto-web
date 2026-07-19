# Plano de Implementação — Passenger Fetching

## Tarefas

### 🔴 Bloco A: Backend — Enriquecimento do endpoint (dependência para todo o resto)

- [ ] A1. Enriquecer o DTO `PassengerProfileResponse`
  - Adicionar campos: Cpf, Rg, Registration, Birthdate, Address (AddressDto), PublicPartitionId, PublicPartitionName, IsActive, CreatedAt, SolicitationCount
  - Manter campos existentes: PassengerId, FullName, Email, Departments
  - Garantir que AddressDto tenha os mesmos campos do AddressCommand (lineOne, lineTwo, district, city, state, postalCode, countryCode)
  - _Requisitos: 1.1, 1.4_

- [ ] A2. Atualizar `PassengerRepository.GetByPassengerIdAsync`
  - Adicionar `.Include(p => p.Address)` e `.Include(p => p.PublicPartition)` aos joins existentes
  - Adicionar contagem de solicitações (`travel_orders` count) via subquery ou join
  - Garantir que retorna `null` quando passengerId não existe (mantém comportamento atual)
  - _Requisitos: 1.1, 1.3_

- [ ] A3. Atualizar o mapeamento no handler/controller
  - Mapear os novos campos do repositório para o DTO enriquecido
  - Formatar datas (Birthdate, CreatedAt) no formato ISO 8601
  - Mapear Address para AddressDto
  - _Requisitos: 1.1_

### 🟢 Bloco B: Frontend — Função de API (depende de A1-A3)

- [ ] B1. Adicionar interfaces `PassengerProfile`, `AddressDto`, `PassengerDepartmentDto` em `src/api/userApi.ts`
  - `PassengerProfile` com todos os campos definidos no design
  - `AddressDto` com campos de endereço
  - `PassengerDepartmentDto` com departmentId e name
  - _Requisitos: 2.2_

- [ ] B2. Adicionar tipo `PassengerProfileResult` e função `fetchPassengerProfile`
  - Seguir padrão union type de `DriverProfileResult`
  - Consumir `GET /api/passengers/${passengerId}` via `fetchProtected`
  - Mensagens de erro em português: 404 → "Passageiro não encontrado.", outros → "Erro ao carregar dados do passageiro. Tente novamente."
  - _Requisitos: 2.1, 2.3, 2.4_

### 🟢 Bloco C: Frontend — Página de Detalhes (depende de B1-B2)

- [ ] C1. Criar `src/pages/PassengerDetailPage.tsx`
  - Importar hooks: `useParams`, `useNavigate`, `useAuth`
  - Importar `fetchPassengerProfile`, `PassengerProfile` de `userApi`
  - Importar ícones: `ArrowLeft, User, Mail, Building2, Calendar, Hash, ShieldCheck, ShieldX, ClipboardList, Loader2` de `lucide-react`
  - _Requisitos: 3.1, 3.3_

- [ ] C2. Implementar estados da página (loading, loaded, error, notFound)
  - Estado `loading`: exibir `<DetailSkeleton />` (seguir padrão de `DriverDetailPage`)
  - Estado `loaded`: exibir header + InfoCards + departamentos + endereço
  - Estado `notFound`: mensagem "Passageiro não encontrado" + botão "Voltar para Usuários"
  - Estado `error`: banner de erro com mensagem + botão "Tentar novamente"
  - _Requisitos: 3.4, 3.5, 3.6_

- [ ] C3. Implementar exibição de dados no estado loaded
  - **Header**: nome completo + botão Voltar (`<ArrowLeft />` + navigate('/users'))
  - **Grid de InfoCards (2 colunas md)**: nome, email, CPF, RG, matrícula, data nascimento, departamento, partição pública, status (ativo/inativo com ícone ShieldCheck/ShieldX), data cadastro, número de solicitações
  - **Seção de Departamentos**: card listando `departments[].name`, ou "Nenhum departamento associado." se array vazio
  - **Seção de Endereço**: card formatado — `lineOne, lineTwo (se houver), district — city/state, postalCode, countryCode`
  - _Requisitos: 3.2, 3.7_

- [ ] C4. Reutilizar/extrait componente `InfoCard` de `DriverDetailPage`
  - Mover `InfoCard` para `src/components/InfoCard.tsx` como componente compartilhado (opcional — pode manter inline se preferir duplicação mínima)
  - OU: duplicar `InfoCard` localmente em `PassengerDetailPage`
  - _Requisitos: 3.2_

### 🟢 Bloco D: Frontend — Registro da Rota (depende de C1-C4)

- [ ] D1. Atualizar `src/App.tsx`
  - Importar `PassengerDetailPage` de `./pages/PassengerDetailPage`
  - Substituir `<ComingSoonPage />` por `<PassengerDetailPage />` na rota `/users/passengers/:userId`
  - _Requisitos: 4.1_

### 🟢 Bloco E: Frontend — Testes (depende de C1-C4)

- [ ] E1. Criar `src/__tests__/PassengerDetailPage.test.tsx`
  - Teste: renderiza skeleton durante loading
  - Teste: exibe todos os campos quando API retorna sucesso
  - Teste: exibe estado "não encontrado" para 404
  - Teste: exibe estado de erro com botão retry para outros status
  - Teste: exibe "Nenhum departamento associado." quando departments vazio
  - Teste: exibe lista de departamentos quando há departamentos
  - Mockar `fetchPassengerProfile` do `userApi` e `useParams` do `react-router-dom`
  - _Requisitos: 5.1_

## Ordem de execução

```
A1 → A2 → A3 → B1 → B2 → C1 → C2 → C3 → C4 → D1 → E1
```

Os blocos A (Backend) são pré-requisitos para B (API client). O bloco B é pré-requisito para C (Página). C é pré-requisito para D (Rota). E (Testes) pode ser feito em paralelo com D, ou após C.

## Coordenação entre agentes

| Bloco | Agente responsável |
|-------|-------------------|
| A (Backend) | Backend agent |
| B, C, D, E (Frontend) | Web agent |
