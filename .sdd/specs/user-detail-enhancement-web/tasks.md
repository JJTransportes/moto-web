# Plano de Implementação — user-detail-enhancement-web

## Pré-requisito: Backend

> ⚠️ As tarefas 1–2 dependem de alterações no backend. O backend precisa enriquecer os endpoints `GET /api/drivers/{userId}` e `GET /api/passengers/{passengerId}` com os campos adicionais antes que as tarefas de front-end possam ser concluídas. Notificar o backend agent para criar um spec correspondente (`user-detail-enhancement-backend`).

---

## Tarefas de Front-end

- [ ] 1. Atualizar tipos TypeScript em `src/api/userApi.ts`
  - Adicionar campos a `DriverProfile`: `rg`, `birthdate`, `isActive`, `access`, `city`, `state`, `createdAt`, `categoryTitle`, `travelCount`, `profilePhotoUrl`
  - Adicionar campos a `PassengerProfile`: `access`, `city`, `state`, `profilePhotoUrl`
  - Todos os campos opcionais (`?`) para compatibilidade com backend antigo
  - _Requisitos: 5.1, 5.2_

- [ ] 2. Atualizar `fetchDriverProfile` com fallback de foto
  - A função existente permanece com a mesma assinatura
  - O tipo de retorno reflete o `DriverProfile` enriquecido
  - _Requisitos: 5.4_

- [ ] 3. Atualizar `fetchPassengerProfile` com fallback de foto
  - Mesma abordagem que `fetchDriverProfile`
  - _Requisitos: 5.5_

- [ ] 4. Atualizar `DriverDetailPage` com dados completos
  - Importar `ShieldCheck`, `ShieldX`, `Calendar`, `MapPin`, `Hash` de `lucide-react`
  - Adicionar badge de status (`isActive`) no cabeçalho, ao lado do nome
  - Se `profilePhotoUrl` presente no driver, usar direto no `UserAvatar` (fallback mantido)
  - Expandir grid de informações para incluir:
    - RG (`driver.rg`)
    - Data de nascimento (`driver.birthdate`, formatar como `dd/mm/aaaa`)
    - Nível de acesso (`driver.access`: "Usuário" ou "Administrador")
    - Cidade/Estado (`driver.city` / `driver.state`)
    - Data de cadastro (`driver.createdAt`, formatar como `dd/mm/aaaa`)
    - Total de Viagens (`driver.travelCount`)
  - Na seção "Veículo Atual", adicionar exibição da categoria (`driver.categoryTitle`) se disponível
  - Ajustar skeleton de carregamento para refletir maior número de cards
  - Layout: grid 2 colunas (md+), 1 coluna (mobile)
  - _Requisitos: 3.1–3.8_

- [ ] 5. Atualizar `PassengerDetailPage` com dados adicionais
  - Importar `ShieldCheck`, `ShieldX` (se ainda não importados)
  - Se `profilePhotoUrl` presente no passenger, usar direto no `UserAvatar` (fallback mantido)
  - Adicionar cards na grid:
    - Nível de acesso (`passenger.access`)
    - Cidade/Estado (`passenger.city` / `passenger.state`)
  - Ajustar layout da grid para acomodar novos cards
  - _Requisitos: 4.1–4.5_

- [ ] 6. Verificar preservação das funcionalidades existentes
  - Testar troca de veículo em `DriverDetailPage` (deve continuar funcionando)
  - Testar exclusão em ambas as páginas (deve continuar funcionando)
  - Testar navegação de volta para `/users`
  - Testar fallback de foto de perfil (quando `profilePhotoUrl` não está disponível)
  - _Requisitos: 6.1–6.5_
