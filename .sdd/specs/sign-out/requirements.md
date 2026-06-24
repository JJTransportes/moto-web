# Documento de Requisitos — Sign-Out

## Introdução

Este documento define os requisitos para implementar a funcionalidade de sair (sign-out) no painel administrativo do Moto. Atualmente o `AuthContext` já expõe um método `signOut()` que limpa a sessão do `sessionStorage`, mas não existe um ponto de acesso visual na interface para que o usuário possa acioná-lo. O objetivo é adicionar um botão "Sair" na parte inferior do componente `Sidebar`, que ao ser clicado execute a limpeza da sessão e redirecione o usuário para a tela de login.

## Requisitos

### Requisito 1: Botão de sair na barra lateral
**Objetivo:** Como um usuário autenticado, quero ver um botão "Sair" na parte inferior da barra lateral, para que eu possa encerrar minha sessão de forma explícita e segura.

#### Critérios de Aceitação
1. Quando o usuário estiver autenticado e visualizando a barra lateral, o sistema deverá exibir um botão "Sair" na parte inferior do componente `Sidebar`, visualmente separado dos links de navegação principais.
2. O botão "Sair" deverá estar sempre visível, independentemente do papel/função do usuário (GlobalAdmin, Driver, Passenger).
3. O botão "Sair" não deverá ser estilizado como um link de navegação (NavLink), mas sim como um botão comum que não navega para uma rota — ele executa uma ação.

### Requisito 2: Execução da ação de sair
**Objetivo:** Como um usuário autenticado, quero que ao clicar em "Sair" minha sessão seja limpa e eu seja redirecionado para a tela de login, para garantir que nenhum acesso não autorizado persista.

#### Critérios de Aceitação
1. Quando o usuário clicar em "Sair", o sistema deverá invocar o método `signOut()` do `AuthContext`.
2. Após a execução do `signOut()`, o sistema deverá redirecionar o usuário para a rota `/login` com `replace: true`, garantindo que o botão "Voltar" do navegador não retorne à página anterior autenticada.
3. Se houver uma chamada de API de sign-out no backend (futura), o sistema deverá aguardar a resposta antes de prosseguir; caso contrário, deverá executar apenas a limpeza local da sessão.

### Requisito 3: Separação visual e semântica do botão de sair
**Objetivo:** Como um usuário, quero que o botão "Sair" seja visualmente distinto dos itens de navegação para evitar cliques acidentais.

#### Critérios de Aceitação
1. O sistema deverá posicionar o botão "Sair" após todos os links de navegação, separado por um espaçamento ou um divisor visual (ex.: `border-t` ou espaçamento extra).
2. O sistema deverá utilizar um ícone de saída (ex.: `LogOut` do Lucide React) junto ao texto "Sair".
3. O botão não deverá acionar navegação via React Router — deverá usar um `<button>` nativo (ou equivalente semântico), não um `<NavLink>`.
