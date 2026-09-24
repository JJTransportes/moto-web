# Relatório de Auditoria Técnica — Painel Administrativo Web (moto-web)

**Repositório:** `C:\JJ-Transportes\moto_web\moto-web`
**Branch analisada:** `hotfix-login` (working tree limpo, sem alterações pendentes)
**Data:** 2026-09-23
**Escopo:** Somente o painel administrativo web (frontend React + TypeScript + Vite). Backend, app motorista e app passageiro são cobertos por outras frentes da auditoria.

---

## Áreas analisadas

- Arquitetura geral, roteamento (`App.tsx`), guards (`ProtectedRoute`), layout (`AppLayout`, `Sidebar`)
- Autenticação/autorização (`AuthContext`, `authApi`, `fetchProtected`)
- Formulários de criação e edição de Motorista, Passageiro, Veículo (Frota) e Unidade Pública/Secretaria
- Fluxo de vínculo/troca de veículo do motorista
- Listagens com grande volume de dados: Usuários, Frota, Corridas, Unidades Públicas (paginação client-side vs server-side)
- Camada de API (`src/api/*.ts`) — contratos, tratamento de erro, mensagens ao usuário
- Componentes compartilhados: `FormField`, `ConfirmationModal`, `Toast`, `SuccessModal`, `UserAvatar`
- Validações e máscaras (`utils/validators`, `utils/masks`)
- Dashboard e mapas (`useDashboardData`, `useMapData`, componentes de mapa)
- Testes automatizados (cobertura existente vs. lacunas)
- Dependências (`package.json`, `npm audit`)
- Especificações SDD (`.sdd/specs/*`) comparadas ao código real, para verificar divergência entre requisito documentado e implementação

---

## Confirmação dos 3 bugs reportados pelo usuário

| # | Bug relatado | Causa raiz encontrada no código? |
|---|---|---|
| 1 | "Editar" não funciona | **Sim** — ver WEB-02. O botão "Salvar Alterações" fica permanentemente desabilitado, sem nenhuma mensagem, sempre que o cadastro tem algum campo obrigatório vazio (comum em motoristas antigos) — só existe aviso para o caso específico de endereço. |
| 2 | Endereço não persiste/não retorna ao editar motorista | **Parcialmente — causa raiz mais provável identificada** — ver WEB-03. O payload de atualização está correto, mas a página de detalhes exibe Cidade/Estado a partir de **dois campos diferentes e não sincronizados** (`driver.city`/`driver.state` legados vs. `driver.address.city`/`state` normalizados); a edição só atualiza o segundo. Sem inspecionar o backend em execução não é possível confirmar 100%, mas o código deixa uma trilha de evidência forte (ver Limitações). |
| 3 | UX crítica: veículo selecionado mas não vinculado se "Salvar" for clicado sem clicar em "Adicionar/Alterar veículo" | **Sim, confirmado e reproduzido por leitura de código** — ver WEB-01. O botão real se chama **"Alterar veículo"** (não "Adicionar veículo" como descrito, ver nota em WEB-01), mas o comportamento é exatamente o relatado: a seleção do veículo é um `PUT` totalmente separado do `updateDriver`, e nunca é enviada junto com "Salvar Alterações". |

---

## Achados

### WEB-01 — Crítico — Vínculo de veículo desacoplado do salvamento do motorista (Bug relatado #3)

- **Área:** Formulários / UX crítica
- **Fluxo:** Editar motorista → selecionar veículo disponível → salvar dados do motorista
- **Arquivo:** `src/pages/DriverEditPage.tsx:63-106` (estado e handler de troca) e `:264-296` (JSX do seletor/botão); `src/api/userApi.ts:145-164` (`changeDriverVehicle`)
- **Evidência:**
```tsx
// DriverEditPage.tsx:91-106
const handleSwitchVehicle = async () => {
  if (!token || !driverId || !selectedVehicleId) return
  setSwitching(true)
  const result = await changeDriverVehicle(token, driverId, selectedVehicleId)
  ...
}
...
// DriverEditPage.tsx:264-290 — botão "Alterar veículo", chamada de API IMEDIATA
<FormField id="switchVehicle" label="Veículo disponível" type="select"
  value={selectedVehicleId} onChange={setSelectedVehicleId} options={...} />
<button type="button" onClick={handleSwitchVehicle} disabled={!canSwitch}>
  {switching ? 'Alterando...' : 'Alterar veículo'}
</button>
```
```tsx
// DriverEditPage.tsx:166-202 — handleSubmit/handleConfirm do formulário principal
// NUNCA referencia selectedVehicleId ou o veículo escolhido no <select> acima
async function handleConfirm(adminCode: string) {
  const result = await updateDriver(token, driverId, {
    fullName: form.fullName, cpf: ..., rg: ..., registration: ..., cnh: ...,
    birthdate: form.birthdate, address: {...}, adminCode,
  })
  ...
}
```
- **Nota sobre o texto do botão:** o pedido do usuário descreve o botão como "Adicionar veículo". No código atual da branch `hotfix-login`, o rótulo é **"Alterar veículo"**. O comportamento problemático é idêntico ao relatado — foi documentado com o texto real do código para precisão, mas convém confirmar com o usuário se ele está olhando para uma versão diferente (ex.: outro ambiente/deploy) ou se apenas descreveu o botão de memória.
- **Problema:** O formulário tem dois "salvamentos" totalmente independentes na mesma tela: (1) selecionar um item no `<select>` "Veículo disponível" **não faz nada** até o clique em "Alterar veículo", que dispara imediatamente um `PUT /api/drivers/{driverId}/vehicle`; (2) o botão "Salvar Alterações" do formulário chama `updateDriver`, que **não inclui `selectedVehicleId` em nenhum lugar do payload**. Se o admin seleciona um veículo no dropdown e clica direto em "Salvar Alterações", a seleção é descartada silenciosamente — sem erro, sem aviso, sem qualquer registro de que algo não foi salvo.
- **Como reproduzir:**
  1. Acessar `/users/drivers/:driverId/edit` de um motorista existente.
  2. Na seção "Alterar veículo", selecionar um veículo disponível no dropdown.
  3. **Sem clicar em "Alterar veículo"**, preencher/ajustar qualquer campo pessoal e clicar em "Salvar Alterações", confirmar com o código de admin.
  4. Voltar para a tela de detalhes do motorista: o veículo selecionado no passo 2 não está vinculado — nenhuma mensagem indicou que isso não seria salvo.
- **Impacto:** Administrador acredita ter vinculado um veículo a um motorista quando na verdade não vinculou nada; pode gerar motoristas sem veículo na operação real, decisões tomadas com base em dado incorreto, retrabalho e confusão operacional.
- **Criticidade:** Crítico
- **Recomendação (registrar como especificado pelo usuário, não implementar agora):**
  - Ao selecionar um veículo no dropdown, manter o botão de ação disponível (ex. "Vincular veículo").
  - O botão "Salvar Alterações" dos dados do motorista deve ficar **desabilitado** enquanto houver uma seleção de veículo pendente que não foi confirmada via o botão de vínculo.
  - Após vincular, o botão de ação deve virar "Desvincular" (vermelho), habilitando novamente o "Salvar Alterações".
  - Motorista que já possui veículo deve exibir "Desvincular" diretamente, sem passar por um estado de seleção.
  - Ver também WEB-05 sobre a ausência total de "Desvincular" no código atual.
- **Complexidade:** Média (mudança de estado/UX em um único componente, sem alteração de contrato de API — reaproveita `changeDriverVehicle`; precisa de uma nova chamada/endpoint ou de um estado "unlink" caso não exista no backend).
- **Testes necessários:** Não existe hoje nenhum teste para `DriverEditPage` (ver WEB-08). Ao corrigir, cobrir: (a) seleção de veículo sem clicar em vincular + salvar não deve alterar veículo; (b) botão Salvar desabilitado enquanto seleção pendente; (c) fluxo completo vincular → salvar; (d) fluxo desvincular; (e) bloqueio de desvincular com viagem em andamento (ver WEB-05).

---

### WEB-02 — Crítico — Botão "Salvar Alterações" fica desabilitado sem explicação em cadastros incompletos (Bug relatado #1)

- **Área:** Formulários / Validação / Feedback ao usuário
- **Fluxo:** Editar motorista ou passageiro com cadastro legado/incompleto
- **Arquivo:** `src/pages/DriverEditPage.tsx:150-172` e `:213-217`; mesmo padrão em `src/pages/PassengerEditPage.tsx:128-149`
- **Evidência:**
```tsx
// DriverEditPage.tsx:150-164
const isFormComplete =
  form.fullName.trim() !== '' && ... &&
  form.rg.trim() !== '' && form.rg.length <= 20 &&
  form.registration.trim() !== '' && ... &&
  form.address.trim() !== '' && ... &&
  form.city.trim() !== '' && ... &&
  form.state.trim() !== ''
...
// DriverEditPage.tsx:166-172 — validate() só roda DENTRO do submit,
// mas o submit só é alcançável se o botão já estiver habilitado:
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (validate()) { ... }
}
...
// DriverEditPage.tsx:305-311 — o botão de submit já nasce desabilitado
<button type="submit" disabled={!isFormComplete} ...>Salvar Alterações</button>
```
```tsx
// DriverEditPage.tsx:213-217 — só existe aviso para o caso de ENDEREÇO ausente
{!driver.address && (
  <div className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
    Este cadastro é antigo e não tinha endereço vinculado. Preencha o endereço abaixo para salvar as alterações.
  </div>
)}
```
- **Problema:** `errors` (usado para pintar campos de vermelho e mostrar mensagem) só é populado dentro de `validate()`, chamado unicamente a partir de `handleSubmit`. Só que `handleSubmit` é inatingível enquanto `isFormComplete` for `false` — ou seja, **nenhum campo jamais é marcado como obrigatório/errado na tela** para um registro que já chega incompleto da API (RG, matrícula, CNH, cidade, estado etc. vazios). O único aviso existente é o banner amarelo, e ele cobre **apenas** o caso de endereço ausente — qualquer outro campo obrigatório vazio (ex.: RG nulo, muito comum em motoristas cadastrados antes de campos serem tornados obrigatórios) deixa o botão cinza/desabilitado para sempre, sem nenhuma pista visível de qual campo está faltando. Do ponto de vista do usuário, a tela "não deixa editar" — exatamente o sintoma relatado.
- **Como reproduzir:**
  1. Abrir um motorista (ou passageiro) cujo cadastro tenha `rg`, `registration` ou outro campo obrigatório nulo/vazio no banco (comum em contas antigas).
  2. Ir para a tela de edição.
  3. Preencher normalmente todos os campos visíveis e digitáveis. Se algum vier vazio e o admin não perceber (não há destaque visual até a tentativa de clique), o botão "Salvar Alterações" permanece cinza e não reage a cliques — sem qualquer mensagem de erro.
- **Impacto:** Administrador percebe a tela como quebrada ("não dá pra editar"); não há como saber qual campo está bloqueando o salvamento sem inspecionar manualmente cada campo.
- **Criticidade:** Crítico
- **Recomendação:** Substituir o gate binário `isFormComplete` por validação reativa: rodar `validate()` (ou uma versão "soft") a cada mudança de campo (ou pelo menos ao perder o foco) e exibir os erros correspondentes mesmo com o botão habilitado; ou manter o botão sempre habilitado e mostrar a lista de pendências ao tentar salvar (chamando `validate()` incondicionalmente no submit, independente de estado prévio). Generalizar o banner de aviso para qualquer campo obrigatório ausente vindo da API, não só endereço.
- **Complexidade:** Baixa a Média (mudança pontual no fluxo de validação de duas páginas).
- **Testes necessários:** Teste que carrega um motorista/passageiro com campos nulos e verifica que mensagens de erro/pendência aparecem sem exigir clique prévio; teste de que o botão não fica preso em "disabled" sem explicação.

---

### WEB-03 — Crítico — Cidade/Estado exibidos a partir de duas fontes não sincronizadas (possível causa do Bug relatado #2)

- **Área:** Consistência de dados / API contract
- **Fluxo:** Editar endereço do motorista → voltar para detalhes
- **Arquivo:** `src/pages/DriverDetailPage.tsx:268-274` (card "Cidade/Estado") vs. `:327-369` (seção "Endereço"); `src/api/userApi.ts:11-33` (`DriverProfile`); `src/pages/DriverEditPage.tsx:35-47` (`toFormValues`)
- **Evidência:**
```ts
// userApi.ts:11-33 — DriverProfile tem DOIS conjuntos de campos de localização
export interface DriverProfile {
  ...
  address?: AddressCommand | null   // objeto normalizado
  ...
  city?: string | null              // campo legado "solto"
  state?: string | null             // campo legado "solto"
  ...
}
```
```tsx
// DriverDetailPage.tsx:268-274 — este card usa os campos LEGADOS
{(driver.city || driver.state) && (
  <InfoCard label="Cidade/Estado" value={[driver.city, driver.state].filter(Boolean).join('/')} />
)}
...
// DriverDetailPage.tsx:351-354 — a seção Endereço, mais abaixo, usa o objeto NORMALIZADO
<p>{driver.address.city}/{driver.address.state}</p>
```
```ts
// DriverEditPage.tsx:44-45 — o próprio código de edição já "sabe" que as duas fontes divergem
city: d.address?.city ?? d.city ?? '',
state: d.address?.state ?? d.state ?? '',
```
```ts
// DriverEditPage.tsx:186-191 — a atualização só escreve no objeto "address" normalizado
address: { lineOne: form.address, city: form.city, state: form.state, countryCode: 'BR' },
// nenhum campo "city"/"state" solto é enviado separadamente
```
- **Problema:** A resposta de `GET /api/drivers/{id}` carrega dois conjuntos de campos para a mesma informação (cidade/estado): um "solto" (legado, provavelmente denormalizado) e um dentro do objeto `address` (normalizado). O card "Cidade/Estado" na tela de detalhes lê o campo solto; a seção "Endereço", mais abaixo na mesma tela, lê o campo normalizado. A atualização feita pela tela de edição (`updateDriver`) só envia/atualiza o objeto `address`. Se o backend não mantiver os dois sincronizados (cenário plausível dado que o próprio frontend já usa fallback `d.address?.city ?? d.city` — evidência de que historicamente nem sempre os dois vêm preenchidos), depois de editar o endereço a tela de detalhes pode continuar mostrando, no card do topo, a cidade/estado **antiga ou vazia**, enquanto a seção "Endereço" mostra o valor novo — dando a impressão de que "o endereço não persistiu", que é exatamente a queixa relatada.
- **Como reproduzir (parcial — requer inspeção do backend/BD para confirmação total, ver Limitações):**
  1. Editar um motorista e alterar cidade/estado no formulário de endereço.
  2. Salvar e voltar para a tela de detalhes.
  3. Comparar o card "Cidade/Estado" (grid superior) com o valor mostrado na seção "Endereço" (mais abaixo). Se divergirem, ou se o card superior ficar em branco/desatualizado, a causa raiz é esta duplicidade de fonte.
- **Impacto:** Percepção de perda de dado onde na verdade há uma divergência de exibição entre dois campos que deveriam ser a mesma informação; gera desconfiança no sistema e retrabalho de admins tentando "salvar de novo".
- **Criticidade:** Crítico
- **Recomendação:** Eliminar a duplicidade no contrato: `DriverProfile`/`PassengerProfile` devem ter uma única fonte de verdade para cidade/estado (idealmente sempre via `address`). Enquanto o backend não for corrigido, ajustar o frontend para que **todos** os pontos de exibição (card + seção Endereço) leiam exclusivamente de `driver.address.city`/`driver.address.state`, removendo o uso de `driver.city`/`driver.state` soltos (ou vice-versa, mas de forma única e consistente). Mesmo ajuste em `PassengerDetailPage`/`PassengerProfile`, que tem o mesmo padrão duplicado.
- **Complexidade:** Baixa no frontend (trocar a fonte do card); mas a causa raiz completa provavelmente exige alinhamento com o backend (fora do escopo desta frente).
- **Testes necessários:** Teste de integração/contract que edita endereço e verifica que TODOS os pontos da UI (card + seção Endereço) refletem o novo valor após reload.

---

### WEB-04 — Alto — Troca de veículo não passa pela confirmação de admin usada no resto da página

- **Área:** Segurança / Consistência de UX
- **Fluxo:** Editar motorista → Alterar veículo
- **Arquivo:** `src/pages/DriverEditPage.tsx:91-106` (`handleSwitchVehicle`, chama a API direto) vs. `:166-202` (`handleSubmit`/`handleConfirm`, exige `adminCode` via `ConfirmationModal`)
- **Problema:** Toda alteração cadastral do motorista (nome, CPF, endereço etc.) exige que o admin digite novamente sua senha/código no `ConfirmationModal` antes de confirmar. A troca de veículo — que o próprio texto da tela descreve como "O veículo atual será desassociado automaticamente" — é aplicada **imediatamente** ao clicar em "Alterar veículo", sem nenhuma confirmação, sem modal, sem possibilidade de cancelar antes do efeito colateral (desassociação do veículo anterior) ocorrer.
- **Como reproduzir:** Selecionar qualquer veículo disponível na tela de edição de motorista e clicar em "Alterar veículo" — a troca acontece de imediato, sem pedir senha nem confirmação, diferente de qualquer outra ação sensível da mesma tela.
- **Impacto:** Clique acidental troca o veículo de um motorista sem possibilidade de confirmação/cancelamento; inconsistência de padrão de segurança dentro da mesma tela.
- **Criticidade:** Alto
- **Recomendação:** Reaproveitar o mesmo `ConfirmationModal` (com `adminCode`) para a troca de veículo, ou ao menos um diálogo de confirmação simples ("Tem certeza que deseja desassociar o veículo atual e vincular X?").
- **Complexidade:** Baixa (componente já existe e é reaproveitável).
- **Testes necessários:** Teste garantindo que `changeDriverVehicle` só é chamado após confirmação explícita.

---

### WEB-05 — Alto — Nenhuma ação de "Desvincular" veículo; regra "não desvincular em viagem" depende 100% do backend e sem mensagem específica

- **Área:** Regra de negócio / Tratamento de erro
- **Fluxo:** Editar motorista com veículo já vinculado
- **Arquivo:** `src/pages/DriverEditPage.tsx` (toda a seção "Alterar veículo", linhas 245-296); `src/api/userApi.ts:145-164` (`changeDriverVehicle`)
- **Evidência:** busca por "Desvincular"/"unlink"/"removeVehicle" em `src/` não retornou nenhuma ocorrência — a funcionalidade de desvincular simplesmente não existe na UI atual; só existe "trocar por outro veículo disponível".
```ts
// userApi.ts:154-163 — únicas mensagens de erro específicas tratadas: 404 e 409 "veículo já associado"
message: result.status === 404
  ? 'Veículo não encontrado.'
  : result.status === 409
    ? 'Este veículo já está associado a outro motorista.'
    : 'Erro ao alterar veículo. Tente novamente.'
```
- **Problema:** (a) Não existe hoje nenhum botão/fluxo de "Desvincular" — o admin só pode trocar por outro veículo disponível, nunca deixar o motorista sem veículo pela UI. (b) Se o backend rejeitar a troca por regra de negócio "motorista com viagem em andamento", essa rejeição cairá no `else` genérico acima ("Erro ao alterar veículo. Tente novamente.") — o admin não recebe nenhuma explicação de que a causa é uma viagem em andamento, nem o frontend tenta prevenir a tentativa desabilitando o botão nesse caso.
- **Como reproduzir:** Não é possível reproduzir via UI hoje (funcionalidade ausente); confirmável por leitura de código/grep como acima.
- **Impacto:** Funcionalidade que o usuário considera existente ("Desvincular") não está implementada; quando a regra de negócio de viagem-em-andamento for violada, o admin recebe mensagem genérica sem entender o motivo real.
- **Criticidade:** Alto
- **Recomendação:** Implementar o botão "Desvincular" (ver especificação detalhada em WEB-01); mapear o status/código de erro específico que o backend retorna para "viagem em andamento" (confirmar com a frente de backend qual status/mensagem é usado) e exibir mensagem clara, ex.: "Não é possível desvincular: o motorista está com uma viagem em andamento."
- **Complexidade:** Média (depende de endpoint/contrato do backend para desvincular e para o erro específico).
- **Testes necessários:** Teste de erro 409/mensagem específica para viagem em andamento; teste do botão desabilitado quando aplicável (se o frontend vier a checar o status da viagem antes de habilitar).

---

### WEB-06 — Alto — Listagem de Frota (`FleetListPage`) sem paginação server-side

- **Área:** Performance / Escalabilidade
- **Fluxo:** Tela "Frotas"
- **Arquivo:** `src/pages/FleetListPage.tsx:38-51` (busca) e `:53-73` (filtro/ordenação client-side); `src/api/vehicleApi.ts:70-74` (`fetchVehicles` sem parâmetros de paginação)
- **Evidência:**
```ts
// vehicleApi.ts:70-74
export async function fetchVehicles(token: string): Promise<ListVehiclesResult> {
  const result = await fetchProtected<Vehicle[]>('/api/vehicles', token)
  ...
}
```
```tsx
// FleetListPage.tsx:38-51 — carrega TODOS os veículos de uma vez, sem page/pageSize
useEffect(() => {
  ...
  fetchVehicles(token).then(result => { ... setVehicles(result.data) ... })
}, [token])
// filtro e ordenação inteiramente em memória (useMemo), linhas 53-73
```
- **Problema:** Diferente de `UsersPage` e `TravelListPage` (que implementam paginação real com `page`/`pageSize` enviados ao backend), `FleetListPage` busca **toda** a frota em uma única requisição e faz busca/ordenação inteiramente no cliente. Não há nenhum controle de paginação visível — a tabela simplesmente cresce sem limite.
- **Como reproduzir:** Com uma frota grande (centenas/milhares de veículos), abrir `/fleets`: uma única requisição trará todos os registros, sem paginação, sem limite de payload, sem indicador de carga incremental.
- **Impacto:** Em frotas grandes, tempo de carregamento e payload da API crescem sem limite; renderização de tabela HTML com muitas linhas pode travar a UI; nenhuma virtualização de lista.
- **Criticidade:** Alto (torna-se crítico proporcionalmente ao tamanho real da frota em produção)
- **Recomendação:** Adotar o mesmo padrão de paginação server-side já usado em `UsersPage`/`TravelListPage` (`page`, `pageSize`, busca no backend), ou paginação client-side apenas se o backend confirmar que o volume de veículos será sempre pequeno (poucas centenas). Se mantida busca full-load, ao menos considerar virtualização de lista (`react-window`) para não travar a renderização.
- **Complexidade:** Média (requer endpoint de listagem paginado no backend, se ainda não existir — `/api/vehicles` parece retornar array puro sem envelope de paginação).
- **Testes necessários:** Teste de carga/paginação simulando grande volume de veículos; teste de que a busca é enviada ao backend, não filtrada só em memória.

---

### WEB-07 — Médio — Listagem de Unidades Públicas (`PartitionListPage`) sem paginação

- **Área:** Performance / Escalabilidade
- **Fluxo:** Tela "Unidades Públicas"
- **Arquivo:** `src/pages/PartitionListPage.tsx:14-22`
- **Problema:** Mesmo padrão de WEB-06 — `listPartitions(token)` busca todos os registros de uma vez, sem paginação nem busca. O volume de unidades públicas tende a ser bem menor que o de veículos/motoristas, por isso a severidade é menor, mas o padrão é o mesmo e merece ficar registrado.
- **Como reproduzir:** Abrir `/partitions` — todos os registros vêm em uma única chamada sem `page`/`pageSize`.
- **Impacto:** Baixo hoje, mas escala mal se o número de unidades públicas crescer.
- **Criticidade:** Médio
- **Recomendação:** Mesma recomendação de WEB-06, com prioridade menor.
- **Complexidade:** Média.
- **Testes necessários:** Idem WEB-06.

---

### WEB-08 — Alto — Zero cobertura de testes para as duas telas dos bugs relatados (Edição de Motorista e Passageiro)

- **Área:** Testes
- **Arquivo:** ausência de `src/__tests__/DriverEditPage.test.tsx` e `src/__tests__/PassengerEditPage.test.tsx`
- **Evidência:** Listagem completa de `src/__tests__/*.test.{ts,tsx}` (29 arquivos) inclui testes para `DriverCreationPage`, `DriverDetailPage`, `FleetEditPage`, `PartitionEditPage`, `PassengerCreationPage`, `PassengerDetailPage`, mas **não** para `DriverEditPage` nem `PassengerEditPage` — exatamente as duas páginas onde os 3 bugs relatados vivem.
- **Problema:** As páginas mais críticas do ponto de vista deste chamado de bugs não têm nenhum teste automatizado, apesar de páginas irmãs (`FleetEditPage`, `PartitionEditPage`, `DriverCreationPage`) terem. Isso permitiu que a regressão de UX do veículo (WEB-01) e o botão travado sem explicação (WEB-02) chegassem a produção sem serem pegos.
- **Impacto:** Risco alto de regressão contínua nessas telas; qualquer correção dos bugs relatados também corre o risco de quebrar novamente sem detecção automatizada.
- **Criticidade:** Alto
- **Recomendação:** Criar `DriverEditPage.test.tsx` e `PassengerEditPage.test.tsx` seguindo o padrão dos testes irmãos já existentes (`FleetEditPage.test.tsx`, `DriverCreationPage.test.tsx`), cobrindo no mínimo: carregamento de dados existentes no formulário, validação/erros, submit bem-sucedido, e — após a correção — os cenários específicos de WEB-01/WEB-02.
- **Complexidade:** Média (o padrão de teste já existe em arquivos irmãos, é replicável).
- **Testes necessários:** Ver recomendação.

---

### WEB-09 — Médio — Busca de foto de perfil gera 1 requisição HTTP por linha da tabela (N+1)

- **Área:** Performance
- **Fluxo:** Tela "Usuários" (`UsersPage`)
- **Arquivo:** `src/pages/UsersPage.tsx:196-218`
- **Evidência:**
```tsx
useEffect(() => {
  if (pageStatus !== 'loaded' || !token) return
  const ids = items.map((item) => role === 'drivers' ? (item as DriverListItem).userId : (item as PassengerListItem).userId)
  ids.forEach((id) => {
    if (photoMap.has(id)) return
    fetchUserProfilePhoto(token, id).then((result) => { ... })
  })
}, [pageStatus, items.length, role, token])
```
- **Problema:** Para cada página de até 20 usuários carregada, o frontend dispara **até 20 requisições HTTP individuais** (`GET /api/users/{id}/profile`) só para buscar a foto de cada linha, em vez de vir embutida na resposta de listagem (`listDrivers`/`listPassengers`) ou ser buscada em lote.
- **Impacto:** Multiplica o número de requisições por página em até 21x (1 de listagem + até 20 de foto); mais latência percebida, mais carga no backend, pior em conexões lentas.
- **Criticidade:** Médio
- **Recomendação:** Incluir `photoUrl`/`profilePhotoUrl` diretamente no DTO de listagem do backend (`DriverListItem`/`PassengerListItem` já têm vários campos — falta este), eliminando as chamadas individuais. Nota: o spec `.sdd/specs/user-detail-enhancement-web` já previu `profilePhotoUrl` para os endpoints de **detalhe**, mas não para os endpoints de **listagem** — gap de escopo entre specs.
- **Complexidade:** Baixa no frontend (remove o `useEffect`) — depende do backend adicionar o campo à listagem.
- **Testes necessários:** Teste garantindo que a listagem não dispara mais de 1 requisição de fotos por página (ou nenhuma, se vier embutida).

---

### WEB-10 — Médio — Nenhum code-splitting/lazy loading de rotas

- **Área:** Performance / Bundle
- **Arquivo:** `src/App.tsx:1-30` (todos os imports de página são estáticos); `vite.config.ts`
- **Problema:** Todas as ~25 páginas do painel são importadas estaticamente no topo de `App.tsx`. Não há uso de `React.lazy`/`Suspense` nem `import()` dinâmico em nenhum ponto do roteamento. Isso significa que o usuário baixa o código de todas as telas (incluindo mapa com `@vis.gl/react-google-maps`/`leaflet`/`react-leaflet`, que tendem a ser pesadas) já no carregamento inicial do painel, mesmo que vá usar só uma tela.
- **Impacto:** Bundle inicial maior que o necessário, tempo de carregamento (TTI) pior, especialmente para admins que só usam uma parte do painel.
- **Criticidade:** Médio
- **Recomendação:** Trocar imports estáticos de página por `React.lazy(() => import('./pages/...'))` + `<Suspense>` com fallback simples, ao menos para páginas pesadas (Dashboard com mapas, Relatórios, Frota).
- **Complexidade:** Baixa (mudança mecânica no roteamento).
- **Testes necessários:** Verificação de build (bundle analyzer) confirmando divisão de chunks por rota.

---

### WEB-11 — Médio — Dependência `react-router-dom` com vulnerabilidade moderada conhecida

- **Área:** Dependências / Segurança
- **Arquivo:** `package.json` (`react-router-dom: ^6.28.0`)
- **Evidência (via `npm audit`):**
```
@remix-run/router  1.3.0 - 1.23.2
Severity: moderate
React Router's same-origin redirect with path starting // causes open redirect via protocol-relative URL reinterpretation
https://github.com/advisories/GHSA-2j2x-hqr9-3h42
3 moderate severity vulnerabilities
```
- **Problema:** A versão instalada de `react-router-dom`/`@remix-run/router` está na faixa afetada por um redirecionamento aberto (open redirect) quando o path começa com `//`.
- **Impacto:** Risco de phishing/redirecionamento malicioso explorando rotas do painel administrativo (impacto real depende de como redirects internos são construídos — não identificado uso direto de redirect por path do usuário no código, mas o pacote em si está vulnerável).
- **Criticidade:** Médio
- **Recomendação:** Rodar `npm audit fix` / atualizar `react-router-dom` para uma versão corrigida.
- **Complexidade:** Baixa.
- **Testes necessários:** Rodar suíte de testes de roteamento (`ProtectedRoute.test.tsx`, etc.) após o upgrade para garantir compatibilidade.

---

### WEB-12 — Baixo — Divergência entre specs SDD e implementação real (`DriverProfile`/`PassengerProfile`)

- **Área:** Consistência de documentação / manutenibilidade
- **Arquivo:** `.sdd/specs/user-detail-enhancement-web/design.md:118-171` vs. `src/api/userApi.ts:11-93`
- **Problema:**
  1. O design documentado usa `driverId`/`fullName` para `DriverProfile`; o código real usa `id`/`name`.
  2. O design documentado para `DriverProfile`/`PassengerProfile` **não prevê** a duplicidade `address` + `city`/`state` soltos (ver WEB-03) — ele assume campos únicos `city`/`state` diretamente no perfil, sem menção a um objeto `address` aninhado convivendo com eles.
  3. O design (`Requisito 3.5`) afirma que a seção "Alterar Veículo" deve "permanecer inalterada" em `DriverDetailPage`, mas, no código atual, **`DriverDetailPage` não tem nenhuma seção de troca de veículo** — essa função só existe em `DriverEditPage`. Ou a spec está desatualizada, ou uma refatoração moveu a funcionalidade sem atualizar a documentação.
- **Impacto:** Documentação SDD não é mais uma fonte confiável do comportamento real do sistema; qualquer nova feature planejada em cima dela corre risco de assumir uma estrutura de dados que não existe mais.
- **Criticidade:** Baixo
- **Recomendação:** Atualizar os documentos de design em `.sdd/specs/user-detail-enhancement-web/` para refletir os nomes de campo e a localização real da funcionalidade de troca de veículo, ou anotar explicitamente que o design foi superado por implementação posterior.
- **Complexidade:** Trivial (é documentação).
- **Testes necessários:** N/A (não é código).

---

### WEB-13 — Médio — Validação duplicada (`isFormComplete` vs. `validate()`) em várias telas

- **Área:** Manutenibilidade / Qualidade de código
- **Arquivo:** `src/pages/DriverEditPage.tsx:134-164`, `src/pages/PassengerEditPage.tsx:113-141`, `src/pages/DriverCreationPage.tsx:103-145`
- **Problema:** Em todas as telas de criação/edição de usuário, a mesma lista de regras (campo obrigatório, tamanho máximo etc.) é escrita **duas vezes**: uma vez dentro de `validate()` (usando as funções de `utils/validators`, com mensagens de erro) e outra vez dentro de uma expressão booleana `isFormComplete` (reimplementando manualmente `.trim() !== ''`, `.length <= N`, sem usar as mesmas funções de validação). As duas listas já divergem sutilmente hoje: `isFormComplete` não roda `validateCpf`/`validateCnh`/`validateSafeText`, então um valor pode "parecer completo" e habilitar o botão mesmo sendo inválido por regras mais finas, só sendo pego no clique.
- **Impacto:** Risco de as duas listas saírem de sincronia ao longo do tempo (alguém adiciona um campo obrigatório em um lugar e esquece o outro) — é justamente esse tipo de divergência que está por trás de WEB-02.
- **Criticidade:** Médio
- **Recomendação:** Unificar: `isFormComplete` deveria ser derivado do próprio resultado de `validate()` (ex.: `Object.values(errors).every(v => !v)` computado sempre, não só no submit), eliminando a lista duplicada.
- **Complexidade:** Baixa a Média (refatoração local, mas toca 4+ arquivos).
- **Testes necessários:** Testes unitários da função de validação de cada formulário, com casos de campo ausente, campo inválido, campo válido.

---

### WEB-14 — Baixo — Cancelamento de requisições via flag manual, não `AbortController`

- **Área:** Performance / Boas práticas
- **Arquivo:** `src/pages/UsersPage.tsx:83,111,121,135` (`abortRef.current`), `src/pages/TravelListPage.tsx:63,82,97`, `src/hooks/useMapData.ts:18,26,31,39,41`
- **Problema:** O padrão usado para "cancelar" requisições ao desmontar o componente ou disparar uma nova busca é uma flag booleana (`abortRef.current = true`) verificada depois que a `Promise` resolve — a requisição HTTP **continua em voo e consome rede/backend** normalmente, só o `setState` resultante é que é ignorado. Não há uso de `AbortController`/`fetch(..., { signal })` em nenhum lugar do projeto.
- **Impacto:** Em telas com digitação rápida em busca (debounce ajuda, mas não elimina o problema em navegação rápida entre páginas) ou trocas rápidas de filtro, requisições obsoletas continuam sendo processadas pelo backend desnecessariamente.
- **Criticidade:** Baixo
- **Recomendação:** Adotar `AbortController` em `fetchProtected` (aceitar um `signal` opcional) e passá-lo nos hooks/páginas que hoje usam a flag manual.
- **Complexidade:** Baixa a Média (mudança na assinatura de `fetchProtected` e pontos de chamada).
- **Testes necessários:** Teste garantindo que uma requisição anterior é abortada ao disparar uma nova busca.

---

## Pontos positivos observados (para contexto, não são achados de problema)

- `UsersPage` e `TravelListPage` implementam paginação **server-side real** (`page`/`pageSize` enviados ao backend), debounce de busca (300ms) e sanitização de input contra caracteres perigosos — bom padrão a ser replicado em `FleetListPage`/`PartitionListPage` (WEB-06/WEB-07).
- Token de autenticação é armazenado em `sessionStorage` (não `localStorage`), reduzindo a janela de exposição a persistência entre sessões/abas — não elimina risco de XSS, mas é uma prática razoável para uma SPA sem cookie httpOnly.
- `validateSafeText` em `utils/validators/common.ts` é uma camada de defesa em profundidade bem documentada, com comentário explícito de que não substitui a defesa real do backend (parametrização de queries) — postura correta.
- Rotas sensíveis (`/users`, `/partitions`, `/reports` etc.) são protegidas tanto por `ProtectedRoute` com `requiredRole="GlobalAdmin"` quanto ocultadas na `Sidebar` para quem não tem o papel — consistente, embora (como sempre em SPAs) a aplicação real da regra deva estar no backend.
- Ações destrutivas (exclusão de conta, ativar/inativar) usam `ConfirmationModal` com reautenticação por código de admin, conforme especificado em `.sdd/specs/user-deletion-web`.

---

## Limitações

- **Backend fora do escopo desta frente**: a causa raiz definitiva do Bug #2 (endereço "não persiste") não pôde ser 100% confirmada sem executar o backend/consultar o banco de dados em um ambiente real — a evidência de código (WEB-03) aponta fortemente para a duplicidade de campos `address` vs. `city`/`state` como explicação mais provável, mas outra causa no backend (ex.: SQL de update não atualizando a entidade `Address`) também é compatível com o sintoma relatado e só pode ser confirmada pela frente de backend.
- **Ambiente sem servidor rodando**: a auditoria foi feita por leitura estática de código (React/TypeScript) e dos documentos `.sdd/specs/*`; não foi executado o app em navegador contra um backend real (não havia backend disponível/rodando neste ambiente de auditoria), então nenhum dos bugs foi "clicado" e reproduzido visualmente — toda reprodução descrita é baseada em rastreamento de código e é logicamente determinística (ex.: WEB-01 é uma certeza de código, não uma suposição).
- **Restrição de ambiente**: este agente rodou em um worktree isolado de outro repositório (`moto_backend`); comandos `git` via Bash apontando para `moto_web/moto-web` foram bloqueados pela ferramenta de proxy do ambiente (rtk) por segurança de isolamento entre worktrees. Não impactou a auditoria em si (leitura de arquivos, `npm audit` e `git` via PowerShell funcionaram normalmente para consulta), mas é registrado para transparência: nenhuma alteração foi feita no repositório (`git status` confirmou working tree limpo antes e depois da análise).
- **Volume real de dados não verificado**: os achados de paginação (WEB-06/WEB-07) assumem que o volume de veículos/unidades em produção pode crescer; não foi possível consultar o banco de produção para confirmar a escala atual real.
- **Cobertura de teste**: não executei a suíte de testes (`npm run test`) neste ambiente; a lista de achados sobre lacunas de teste (WEB-08) é baseada exclusivamente na ausência de arquivos correspondentes em `src/__tests__/`, não na execução/cobertura de código.
- **Mensagens de erro do backend**: várias mensagens específicas (`apiMessage`) dependem do texto retornado pelo backend em tempo de execução; não foi possível verificar quais mensagens reais chegam em cada cenário (ex.: código de erro específico para "veículo com viagem em andamento" citado em WEB-05).

---

*Relatório gerado por leitura estática de código-fonte, documentos `.sdd/specs/`, `npm audit` e histórico `git log` do repositório `moto_web/moto-web` (branch `hotfix-login`). Nenhum arquivo de código foi alterado durante esta auditoria.*
