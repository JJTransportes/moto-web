# Documento de Requisitos — user-deletion-web

## Introdução

Este documento define os requisitos para implementar a funcionalidade de exclusão de usuários (soft-delete) no painel administrativo do Moto. O backend já expõe o endpoint `DELETE /api/users/{userId}` que exige re-verificação de credenciais do administrador que está realizando a ação (campo `adminCode`). O objetivo é adicionar pontos de acesso no front-end para que administradores Globais possam desativar contas de motoristas e passageiros diretamente pela interface web.

A exclusão segue uma estratégia de **soft-delete**: a conta é marcada como inativa (`active = false`), não removida do banco de dados. O backend também invalida os tokens JWT do usuário excluído via Redis.

---

## Requisito 1: Botão de exclusão na lista de usuários

**Objetivo:** Como um administrador global autenticado, quero ver um botão "Excluir" ao lado de cada usuário na lista de usuários (página `UsersPage`), para que eu possa desativar uma conta diretamente a partir da listagem.

#### Critérios de Aceitação

1. Quando o administrador estiver visualizando a lista de usuários (motoristas ou passageiros), o sistema deverá exibir um botão "Excluir" na coluna de ações de cada linha da tabela, ao lado do botão "Selecionar" existente.
2. O botão "Excluir" só deverá ser exibido para usuários que estão **ativos** (`isActive = true`). Usuários já inativos não devem exibir o botão, pois já foram excluídos anteriormente.
3. O botão "Excluir" deverá usar um estilo visual distinto (ex.: texto vermelho/borda vermelha) para indicar que é uma ação destrutiva.
4. Ao clicar em "Excluir", o sistema deverá abrir o modal de confirmação (`ConfirmationModal`) solicitando o código de administrador (senha do admin logado).
5. O botão "Excluir" não deverá ter navegação associada — ele aciona o fluxo de exclusão modal.

---

## Requisito 2: Botão de exclusão na página de detalhes do usuário

**Objetivo:** Como um administrador global autenticado, quero ver um botão "Excluir conta" nas páginas de detalhes de motoristas (`DriverDetailPage`) e passageiros (`PassengerDetailPage`), para que eu possa desativar uma conta a partir da visualização detalhada.

#### Critérios de Aceitação

1. Quando o administrador estiver visualizando os detalhes de um motorista ou passageiro **ativo**, o sistema deverá exibir um botão "Excluir conta" visualmente separado das demais informações.
2. O botão não deverá ser exibido se o usuário já estiver inativo (já excluído).
3. Ao clicar em "Excluir conta", o sistema deverá abrir o modal de confirmação (`ConfirmationModal`) solicitando o código de administrador.
4. O botão deverá ser posicionado em uma seção de ações/danger-zone, visualmente distinta do restante da página.

---

## Requisito 3: Fluxo de exclusão com modal de confirmação

**Objetivo:** Como um administrador global autenticado, quero confirmar a exclusão fornecendo minha senha como código de administrador em um modal, para que a ação seja segura e intencional.

#### Critérios de Aceitação

1. O modal de confirmação (`ConfirmationModal`, já existente no projeto) deverá ser reutilizado, exibindo um título como "Excluir conta" e uma descrição como "Tem certeza que deseja excluir a conta de {nome do usuário}? Esta ação é irreversível."
2. O modal deverá solicitar o "Código do administrador" (senha do admin logado) em um campo de senha.
3. Enquanto a requisição estiver em andamento, o botão "Confirmar" deverá ser desabilitado e exibir "Aguarde...".
4. O campo de senha e o botão "Cancelar" também deverão ser desabilitados durante o carregamento.
5. Após o sucesso da exclusão, o modal deverá fechar e o sistema deverá exibir um feedback visual de sucesso.
6. Se a exclusão falhar, o modal deverá exibir a mensagem de erro abaixo do campo de senha e permanecer aberto para que o admin possa tentar novamente.
7. O modal deverá ser fechável ao pressionar a tecla `Escape` (já implementado no componente existente) e ao clicar em "Cancelar".
8. Ao abrir o modal, o campo de senha deverá receber foco automaticamente (já implementado no componente existente).

---

## Requisito 4: Chamada de API de exclusão

**Objetivo:** Como sistema, quero que o front-end se comunique corretamente com o endpoint `DELETE /api/users/{userId}` do backend para realizar a exclusão.

#### Critérios de Aceitação

1. O sistema deverá criar uma função na camada de API (`userApi.ts` ou novo arquivo) que envie uma requisição `DELETE` para `/api/users/{userId}` com o `adminCode` no corpo da requisição.
2. A requisição deverá incluir o token JWT do admin logado no header `Authorization`.
3. Em caso de sucesso (HTTP 200), a função deverá retornar os dados da resposta: `{ userId, message }`.
4. Em caso de erro, a função deverá tratar os seguintes códigos de status:
   - `400`: Admin tentando excluir a si mesmo — exibir mensagem "Você não pode excluir sua própria conta. Use o menu de configurações ou solicite que outro administrador realize a exclusão."
   - `401`: Código de administrador inválido — exibir mensagem "Código do administrador inválido."
   - `404`: Usuário não encontrado — exibir mensagem "Usuário não encontrado."
   - `409`: Conta já inativa ou com viagens ativas — exibir mensagem apropriada retornada pelo backend.
   - `0` (erro de rede): exibir mensagem "Erro de conexão. Tente novamente."

---

## Requisito 5: Feedback visual e atualização após exclusão

**Objetivo:** Como um administrador global autenticado, quero receber feedback visual claro após a exclusão e ver a interface atualizada refletindo o novo estado do usuário.

#### Critérios de Aceitação

1. **Na lista de usuários (`UsersPage`)**: Após a exclusão bem-sucedida, o sistema deverá fechar o modal e recarregar a lista de usuários da página atual, refletindo o novo status (`isActive = false`) do usuário excluído.
2. **Na página de detalhes (`DriverDetailPage` / `PassengerDetailPage`)**: Após a exclusão bem-sucedida, o sistema deverá fechar o modal e recarregar os dados do perfil, que agora mostrarão o status "Inativo" e ocultarão o botão "Excluir conta".
3. O sistema deverá exibir um toast/notificação de sucesso (ex.: "Conta de {nome} excluída com sucesso.") após a operação. Como o projeto atualmente não possui um sistema de toast, a notificação poderá ser implementada como um alerta inline temporário ou um componente de toast simples.
4. Em caso de falha na requisição (exceto 401, que mantém o modal aberto), o modal deverá fechar e exibir uma notificação de erro.

---

## Requisito 6: Prevenção de auto-exclusão

**Objetivo:** Como um administrador global autenticado, quero ser impedido de excluir minha própria conta através da interface administrativa, para que eu não perca acesso acidentalmente.

#### Critérios de Aceitação

1. O sistema não deverá exibir o botão "Excluir" (na lista) nem o botão "Excluir conta" (nos detalhes) quando o usuário listado for o próprio admin logado.
2. Esta verificação deve ser feita comparando o `userId` do usuário listado com o `userId` do admin obtido via `AuthContext`.
3. Caso o endpoint retorne HTTP 400 por auto-exclusão (medida de segurança extra), o modal deverá exibir a mensagem apropriada.
