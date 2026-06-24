# Plano de Implementação — Sign-Out

## Tarefas

- [ ] 1. Adicionar botão "Sair" no componente Sidebar
  - Importar `LogOut` de `lucide-react` e `useNavigate` de `react-router-dom`
  - Importar o hook `useAuth` (já importado)
  - Renderizar um `<button>` com ícone `LogOut` e texto "Sair" após os links de navegação
  - Posicionar o botão no final da Sidebar usando `mt-auto` com um divisor visual (`<hr>`) antes do botão
  - Estilizar o botão com cores distintas (ex.: `text-slate-500 hover:text-red-600 hover:bg-red-50`)
  - Usar `rounded-xl px-3 py-3 text-sm font-medium transition-colors` para consistência com os links existentes
  - _Requisitos: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [ ] 2. Implementar ação de sign-out
  - Obter `signOut` do `useAuth()` e `navigate` do `useNavigate()`
  - No `onClick` do botão, chamar `signOut()` e depois `navigate('/login', { replace: true })`
  - Usar `type="button"` no `<button>` para evitar submit acidental
  - _Requisitos: 2.1, 2.2_

- [ ] 3. Atualizar testes existentes do Sidebar
  - Adicionar teste para renderização do botão "Sair"
  - Adicionar teste para clique que chama `signOut()` e redireciona para `/login`
  - Verificar que o botão é um elemento `<button>` sem atributo `to`
  - _Requisitos: 1.1, 2.1, 2.2_
