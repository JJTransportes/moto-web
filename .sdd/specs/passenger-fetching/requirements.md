# Documento de Requisitos — Passenger Fetching

## Introdução

Este documento define os requisitos para implementar a consulta individual de passageiros e a página de detalhes dedicada no painel administrativo do Moto. Atualmente, o sistema já possui listagem paginada de passageiros (`GET /api/passengers`) e criação (`POST /api/passengers`), mas a rota de detalhes (`/users/passengers/:userId`) exibe apenas uma página "Em breve" (ComingSoonPage). O backend expõe `GET /api/passengers/{passengerId}` porém com um payload reduzido — apenas PassengerId, FullName, Email e Departments. Este projeto visa enriquecer o endpoint individual para incluir todos os dados relevantes do passageiro (documentos, endereço, partição pública, etc.) e implementar a página de detalhes correspondente no frontend.

## Requisitos

### Requisito 1: Endpoint individual enriquecido de passageiro (Backend)
**Objetivo:** Como desenvolvedor frontend, quero que o endpoint `GET /api/passengers/{passengerId}` retorne todos os dados relevantes do passageiro, para que a página de detalhes possa exibir informações completas sem necessidade de múltiplas chamadas à API.

#### Critérios de Aceitação
1. Quando uma requisição autenticada com role GlobalAdmin for feita para `GET /api/passengers/{passengerId}`, o sistema deverá retornar, além dos campos atuais (PassengerId, FullName, Email, Departments), os seguintes campos adicionais: Cpf, Rg, Registration, Birthdate, Address (lineOne, lineTwo, district, city, state, postalCode, countryCode), PublicPartitionId, PublicPartitionName, IsActive, CreatedAt, SolicitationCount.
2. O endpoint deverá manter a proteção de autorização existente (GlobalAdminAccess).
3. O endpoint deverá retornar HTTP 404 quando o passengerId não corresponder a um passageiro existente.
4. A resposta deverá seguir a estrutura de tipos já usada no `PassengerListItem` do endpoint de listagem, garantindo consistência entre os endpoints.

### Requisito 2: Função de API para buscar passageiro individual (Frontend)
**Objetivo:** Como desenvolvedor frontend, quero uma função tipada `fetchPassengerProfile` que consuma o endpoint `GET /api/passengers/{passengerId}`, para que a página de detalhes possa buscar os dados de forma segura e consistente com o padrão existente.

#### Critérios de Aceitação
1. O sistema deverá implementar a função `fetchPassengerProfile(token: string, passengerId: string): Promise<PassengerProfileResult>` no módulo `src/api/userApi.ts`, seguindo o mesmo padrão de `fetchDriverProfile`.
2. A interface `PassengerProfile` deverá incluir todos os campos retornados pelo endpoint enriquecido.
3. O tipo de resultado `PassengerProfileResult` deverá seguir o padrão union type (`{ ok: true; data: PassengerProfile } | { ok: false; status: number; message: string }`).
4. As mensagens de erro deverão ser em português, seguindo o padrão do projeto (ex.: "Passageiro não encontrado." para 404).

### Requisito 3: Página de detalhes do passageiro (Frontend)
**Objetivo:** Como administrador GlobalAdmin, quero acessar uma página de detalhes de um passageiro específico para visualizar todas as suas informações cadastrais, dados de contato e departamentos associados.

#### Critérios de Aceitação
1. Quando o administrador navegar para `/users/passengers/:userId`, o sistema deverá renderizar a página `PassengerDetailPage` com os dados completos do passageiro.
2. A página deverá exibir: nome completo, e-mail, CPF, RG, matrícula, data de nascimento, departamento, partição pública, endereço completo, status (ativo/inativo), data de cadastro e número de solicitações.
3. A página deverá ter um botão "Voltar" que retorna à listagem de usuários (`/users`).
4. A página deverá exibir skeleton de carregamento enquanto os dados são buscados (seguindo o padrão de `DriverDetailPage`).
5. A página deverá exibir mensagem "Passageiro não encontrado" com link de retorno quando o endpoint retornar 404.
6. A página deverá exibir mensagem de erro com opção "Tentar novamente" em caso de outros erros de rede/servidor.
7. A página deverá exibir a lista de departamentos associados ao passageiro, se houver (campo `Departments` retornado pelo endpoint).

### Requisito 4: Registro da rota no roteador (Frontend)
**Objetivo:** Substituir o componente `ComingSoonPage` atualmente mapeado em `/users/passengers/:userId` pela nova página de detalhes implementada.

#### Critérios de Aceitação
1. O sistema deverá importar `PassengerDetailPage` no `App.tsx` e substituir `<ComingSoonPage />` na rota `/users/passengers/:userId`.
2. A rota deverá permanecer dentro do grupo protegido por `GlobalAdmin`.

### Requisito 5: Testes automatizados da página de detalhes (Frontend)
**Objetivo:** Garantir que a página de detalhes do passageiro funcione corretamente em todos os cenários (carregamento, sucesso, não encontrado, erro).

#### Critérios de Aceitação
1. O sistema deverá incluir testes unitários para `PassengerDetailPage` cobrindo:
   - Renderização do skeleton durante carregamento.
   - Exibição correta de todos os campos quando os dados são carregados com sucesso.
   - Exibição da mensagem "Passageiro não encontrado" quando a API retorna 404.
   - Exibição da mensagem de erro quando a API falha com outro status.
2. Os testes deverão mockar a chamada à API `fetchPassengerProfile` e o hook `useParams`.
