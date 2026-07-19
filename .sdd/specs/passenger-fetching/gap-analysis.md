# Validação de Gap — Passenger Fetching

## Análise do Código Existente

### O que já existe

| Recurso | Localização | Status |
|---------|-------------|--------|
| `GET /api/passengers/{passengerId}` (backend) | Backend API | ✅ Existe, mas payload é reduzido (apenas PassengerId, FullName, Email, Departments[]) |
| `GET /api/passengers` (backend) | Backend API | ✅ Existe com payload completo (PassengerListItem com 15+ campos) |
| Rota `/users/passengers/:userId` | `src/App.tsx:64` | ✅ Registrada, mas aponta para `<ComingSoonPage />` |
| `fetchDriverProfile` (padrão) | `src/api/userApi.ts:39-52` | ✅ Padrão de referência para fetch individual |
| `fetchProtected` (helper HTTP) | `src/api/authApi.ts` | ✅ Reutilizável |
| `PassengerListItem` (tipo base) | `src/api/userListApi.ts:18-33` | ✅ Tipo com todos os campos necessários |
| `DriverDetailPage` (padrão de página) | `src/pages/DriverDetailPage.tsx` | ✅ Padrão de referência (loading, error, notFound, detail) |
| `InfoCard` (componente auxiliar) | `src/pages/DriverDetailPage.tsx:194-209` | ✅ Reutilizável ou copiável |
| `DetailSkeleton` (componente de loading) | `src/pages/DriverDetailPage.tsx:13-26` | ✅ Padrão de referência |
| Página de criação de passageiro | `src/pages/PassengerCreationPage.tsx` | ✅ Já existe |

### Gaps identificados

| Gap | Severidade | Descrição |
|-----|-----------|-----------|
| **GAP-1: Backend — Endpoint individual enriquecido** | 🔴 Crítico | `GET /api/passengers/{passengerId}` retorna apenas 4 campos. Precisa incluir CPF, RG, Registration, Birthdate, Address completo, PublicPartition, IsActive, CreatedAt, SolicitationCount. Sem este enriquecimento, a página de detalhes fica muito pobre. |
| **GAP-2: Frontend — Função `fetchPassengerProfile`** | 🔴 Crítico | Não existe função para buscar passageiro individual. Precisa ser criada em `src/api/userApi.ts` seguindo o padrão `fetchDriverProfile`. |
| **GAP-3: Frontend — Página `PassengerDetailPage`** | 🔴 Crítico | Não existe. Precisa ser criada em `src/pages/PassengerDetailPage.tsx`. |
| **GAP-4: Frontend — Registro da rota** | 🟡 Médio | `App.tsx` linha 64 precisa trocar `<ComingSoonPage />` por `<PassengerDetailPage />`. |
| **GAP-5: Frontend — Testes** | 🟡 Médio | Não existem testes para `PassengerDetailPage`. Precisa criar `src/__tests__/PassengerDetailPage.test.tsx`. |

### Análise de dependências entre gaps

```
GAP-1 (Backend endpoint) → GAP-2 (API function) → GAP-3 (Page) → GAP-4 (Router) → GAP-5 (Tests)
```

O GAP-1 é bloqueante para os demais: a função `fetchPassengerProfile` depende do contrato do endpoint enriquecido. Os demais gaps do frontend dependem da função de API.

### Recomendação

1. **Primeiro**: Backend deve enriquecer `GET /api/passengers/{passengerId}` (GAP-1)
2. **Depois**: Frontend implementa `fetchPassengerProfile` + `PassengerDetailPage` + rota + testes (GAPs 2-5)
