# Documento de Requisitos — user-detail-enhancement-web

## Introdução

As páginas de detalhes de usuários (motoristas e passageiros) no painel administrativo do Moto atualmente exibem apenas dados parciais do perfil. A página de detalhes do motorista (`DriverDetailPage`) utiliza o endpoint `GET /api/drivers/{userId}` que retorna apenas campos básicos (`DriverProfile`: driverId, fullName, email, cpf, cnh, department, vehicle), omitindo informações como status da conta, data de cadastro, localização, categoria do veículo e estatísticas de viagens. Já a página de detalhes do passageiro (`PassengerDetailPage`) é mais completa, mas ainda omite alguns campos como `access`, `city` e `state`.

O objetivo deste spec é substituir a entidade de dados utilizada nas páginas de detalhes pela **entidade mais completa disponível**, combinando os campos do perfil com todos os campos presentes nas entidades de listagem (`DriverListItem`, `PassengerListItem`) e enriquecendo os endpoints do backend para retornar o conjunto completo de dados. Dessa forma, o administrador terá uma visão holística de cada usuário, mantendo todas as ações de atualização e exclusão já implementadas.

---

## Requisito 1: Backend — Endpoint de detalhes do motorista enriquecido

**Objetivo:** Como sistema, quero que o endpoint `GET /api/drivers/{userId}` retorne todos os campos disponíveis do motorista, para que o front-end possa exibir uma visão completa.

#### Critérios de Aceitação

1. O endpoint `GET /api/drivers/{userId}` deverá incluir todos os campos atuais (`driverId`, `fullName`, `email`, `cpf`, `cnh`, `department`, `vehicle`) mais os seguintes campos adicionais:
   - `rg` (string) — RG do motorista
   - `birthdate` (date) — Data de nascimento
   - `isActive` (boolean) — Status da conta, originado de `users.is_active`
   - `access` (string) — Nível de acesso (`User` ou `Admin`)
   - `city` (string) — Cidade do motorista
   - `state` (string) — Estado do motorista
   - `createdAt` (datetime) — Data de criação do registro
   - `categoryTitle` (string | null) — Nome da categoria do veículo associado (via `vehicles.category_id` → `categories.title`), ou `null` se não houver veículo ou categoria
   - `travelCount` (integer) — Total de viagens atribuídas a este motorista
   - `profilePhotoUrl` (string | null) — URL da foto de perfil do usuário
2. A estrutura de resposta existente deve ser preservada (aditiva), sem breaking changes.
3. O campo `vehicle` deve permanecer na resposta com sua estrutura atual.
4. Em caso de `userId` inexistente, o endpoint deve retornar HTTP 404.

---

## Requisito 2: Backend — Endpoint de detalhes do passageiro enriquecido

**Objetivo:** Como sistema, quero que o endpoint `GET /api/passengers/{passengerId}` retorne campos adicionais para completar a visão do passageiro.

#### Critérios de Aceitação

1. O endpoint `GET /api/passengers/{passengerId}` deverá incluir todos os campos atuais mais os seguintes campos adicionais:
   - `access` (string) — Nível de acesso (`User` ou `Admin`)
   - `city` (string) — Cidade do passageiro
   - `state` (string) — Estado do passageiro
   - `profilePhotoUrl` (string | null) — URL da foto de perfil do usuário
2. A estrutura de resposta existente deve ser preservada (aditiva).
3. Em caso de `passengerId` inexistente, o endpoint deve retornar HTTP 404.

---

## Requisito 3: Web — Página de detalhes do motorista com dados completos

**Objetivo:** Como um administrador global autenticado, quero ver todas as informações disponíveis do motorista na página de detalhes, para que eu tenha uma visão completa sem precisar consultar outras telas.

#### Critérios de Aceitação

1. A página `DriverDetailPage` deve buscar os dados utilizando o endpoint enriquecido (`GET /api/drivers/{userId}`) e exibir todos os campos retornados.
2. O cabeçalho da página deve exibir:
   - Avatar do usuário (já implementado)
   - Nome completo (já implementado)
   - Badge de status (verde "Ativo" / vermelho "Inativo"), igual ao usado na lista de usuários
3. A seção "Informações Pessoais" (grid de cards) deve exibir:
   - Nome completo
   - E-mail
   - CPF
   - RG
   - CNH
   - Data de nascimento (formatada como `dd/mm/aaaa`)
   - Nível de acesso (ex.: "Usuário" para `User`, "Administrador" para `Admin`)
   - Departamento
   - Cidade/Estado
   - Data de cadastro (formatada como `dd/mm/aaaa`)
4. A seção "Veículo Atual" deve permanecer inalterada (já exibe marca, modelo, ano e placa). Deve também exibir a categoria do veículo (`categoryTitle`) se disponível.
5. A seção "Alterar Veículo" deve permanecer inalterada.
6. A seção "Zona de Perigo" (exclusão) deve permanecer inalterada.
7. A página deve exibir o campo `travelCount` em algum local apropriado (ex.: card "Total de Viagens" na grid de informações).
8. A página deve usar um layout responsivo (grid 2 colunas em desktop, 1 coluna em mobile), consistente com o padrão existente.

---

## Requisito 4: Web — Página de detalhes do passageiro com dados completos

**Objetivo:** Como um administrador global autenticado, quero ver todas as informações disponíveis do passageiro na página de detalhes, incluindo os campos que atualmente só aparecem na listagem.

#### Critérios de Aceitação

1. A página `PassengerDetailPage` deve buscar os dados utilizando o endpoint enriquecido e exibir todos os campos retornados.
2. O cabeçalho da página (já implementado) deve permanecer com avatar, nome e badge de status.
3. A seção "Informações Pessoais" (grid de cards) deve exibir todos os campos já existentes mais os novos:
   - Nível de acesso (`access`) — ex.: "Usuário" para `User`, "Administrador" para `Admin`
   - Cidade/Estado — se disponíveis
4. As seções "Departamentos", "Endereço" e "Zona de Perigo" devem permanecer inalteradas.
5. A página deve usar o layout responsivo existente.

---

## Requisito 5: Web — Atualização do tipo da entidade de dados

**Objetivo:** Como desenvolvedor, quero que os tipos TypeScript utilizados nas páginas de detalhes sejam atualizados para refletir a entidade mais completa, eliminando a necessidade de chamadas separadas para foto de perfil.

#### Critérios de Aceitação

1. O tipo `DriverProfile` em `src/api/userApi.ts` deve ser atualizado para incluir todos os novos campos (`rg`, `birthdate`, `isActive`, `access`, `city`, `state`, `createdAt`, `categoryTitle`, `travelCount`, `profilePhotoUrl`).
2. O tipo `PassengerProfile` em `src/api/userApi.ts` deve ser atualizado para incluir os novos campos (`access`, `city`, `state`, `profilePhotoUrl`).
3. Quando `profilePhotoUrl` estiver presente na resposta do endpoint de detalhes, a chamada separada a `fetchUserProfilePhoto` deve ser removida, usando o valor diretamente do perfil.
4. A função `fetchDriverProfile` deve ser atualizada para retornar o tipo enriquecido.
5. A função `fetchPassengerProfile` deve ser atualizada para retornar o tipo enriquecido.

---

## Requisito 6: Preservação das funcionalidades existentes

**Objetivo:** Como administrador, quero que todas as funcionalidades existentes nas páginas de detalhes continuem funcionando após a migração para a entidade mais completa.

#### Critérios de Aceitação

1. A troca de veículo do motorista (`changeDriverVehicle`) deve continuar funcionando na `DriverDetailPage`.
2. A exclusão de conta (`deleteUserAccount`) deve continuar funcionando em ambas as páginas.
3. A navegação de volta para a lista (`/users`) deve continuar funcionando.
4. O carregamento (skeleton), estados de erro e "não encontrado" devem continuar funcionando.
5. A busca de foto de perfil deve continuar funcionando (se `profilePhotoUrl` não estiver disponível no perfil enriquecido, a chamada separada deve ser mantida como fallback).
