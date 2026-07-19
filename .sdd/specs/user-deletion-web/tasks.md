# Plano de Implementação — user-deletion-web

## Tarefas

- [ ] 1. Adicionar função `deleteUserAccount` na camada de API
  - Criar função `deleteUserAccount(token, userId, adminCode)` em `src/api/userApi.ts`
  - Usar `fetchProtected` com método `DELETE` para `/api/users/{userId}`
  - Enviar `{ adminCode }` no corpo da requisição
  - Tratar retornos: 200 (sucesso), 400 (auto-exclusão), 401 (adminCode inválido), 404 (não encontrado), 409 (conflito), 0 (rede)
  - Seguir o padrão `{ ok: true, data: ... } | { ok: false, status, message }` dos demais endpoints
  - _Requisitos: 4.1, 4.2_

- [ ] 2. Adicionar botão "Excluir" na lista de usuários (`UsersPage`)
  - Importar `Trash2` de `lucide-react` e `deleteUserAccount` de `userApi`
  - Obter `user` do `useAuth()` para comparar `userId`
  - Adicionar estados: `deletingUserId`, `deleteLoading`, `deleteError`, `successMessage`
  - Renderizar botão "Excluir" na coluna de ações apenas quando `item.isActive === true` e `item.userId !== admin.userId`
  - Usar estilo destrutivo: `border-red-300 text-red-600 hover:bg-red-50`
  - Adicionar `ConfirmationModal` vinculado ao estado `deletingUserId`
  - No `onConfirm`: chamar `deleteUserAccount`, gerenciar loading/error
  - No sucesso: fechar modal, recarregar lista (`fetchData`), exibir `successMessage` por 4s
  - No erro 401: manter modal aberto e exibir erro no modal
  - Nos demais erros: fechar modal e exibir notificação de erro
  - _Requisitos: 1.1–1.5, 3.1–3.6, 5.1, 5.3, 6.1_

- [ ] 3. Adicionar botão "Excluir conta" na página de detalhes do motorista (`DriverDetailPage`)
  - Importar `Trash2`, `deleteUserAccount`, `ConfirmationModal`
  - Adicionar estados: `deleting`, `deleteError`, `successMessage`
  - Renderizar seção "Zona de Perigo" ao final da página com borda vermelha (`border-red-200`, `bg-red-50`)
  - Renderizar botão "Excluir conta" apenas se `driver.isActive` (mapear campo — verificar se o perfil retorna `isActive`)
  - Ocultar se `userId` do perfil for o próprio admin
  - Adicionar `ConfirmationModal` e fluxo de exclusão
  - No sucesso: recarregar perfil (`loadDriver`), exibir `successMessage`
  - _Requisitos: 2.1–2.3, 3.1–3.6, 5.2, 5.3, 6.1_

- [ ] 4. Adicionar botão "Excluir conta" na página de detalhes do passageiro (`PassengerDetailPage`)
  - Mesmo padrão do `DriverDetailPage`, adaptado para `passenger.isActive`
  - No sucesso: recarregar perfil (`loadPassenger`), exibir `successMessage`
  - _Requisitos: 2.1–2.3, 3.1–3.6, 5.2, 5.3, 6.1_

- [ ] 5. Adicionar componente de notificação de sucesso (alerta inline)
  - Implementar alerta verde inline nos três componentes (`UsersPage`, `DriverDetailPage`, `PassengerDetailPage`)
  - Usar estado `successMessage` com `setTimeout` para limpar após 4 segundos
  - Estilo: `rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700`
  - _Requisitos: 5.3_

- [ ] 6. Testes
  - Testar `deleteUserAccount` com mock de `fetchProtected`
  - Testar que botão "Excluir" não aparece para usuário inativo ou para o próprio admin
  - Testar fluxo completo de exclusão com sucesso e com erro
  - _Requisitos: 1.1, 1.2, 6.1_
