# Tarefas — Cobalto Líquido v2 no Painel Administrativo

- [ ] 1. Integrar a fundação Cobalto
  - [ ] 1.1 Incorporar `tokens.css`, `animacoes.css` e `componentes.css` em `src/styles/cobalto/` e importá-los na ordem definida.
  - [ ] 1.2 Disponibilizar Sora e Plus Jakarta Sans localmente e configurar tipografia-base.
  - [ ] 1.3 Mapear Tailwind para variáveis Cobalto, preservando compatibilidade durante a migração.
  - [ ] 1.4 Configurar foco visível e `prefers-reduced-motion` sem executar scripts imperativos do catálogo.
  - Requisitos: 1.1–1.6, 6.4–6.5

- [ ] 2. Migrar componentes compartilhados
  - [ ] 2.1 Padronizar botões, campos, cards e badges com variantes TypeScript sem `any`.
  - [ ] 2.2 Padronizar tabelas, modais, toasts, skeletons, estados vazios e erros.
  - [ ] 2.3 Preservar contratos públicos, callbacks, loading e bloqueio contra envio duplicado.
  - [ ] 2.4 Restringir blur real a overlays e superfícies apropriadas.
  - Requisitos: 6.1–6.5

- [ ] 3. Migrar estrutura e navegação
  - [ ] 3.1 Aplicar Cobalto em `AppLayout` e `Sidebar`.
  - [ ] 3.2 Preservar rotas, permissões por papel, agrupamentos e logout.
  - [ ] 3.3 Garantir estado ativo textual/visual, `aria-current`, responsividade e rolagem.
  - Requisitos: 2.1–2.4

- [ ] 4. Migrar o dashboard
  - [ ] 4.1 Reestilizar KPIs com destaque Safira para o indicador prioritário e cartões claros para os demais.
  - [ ] 4.2 Reestilizar tabela/barras usando exclusivamente dados atuais.
  - [ ] 4.3 Uniformizar loading, vazio, erro e retry.
  - Requisitos: 3.1–3.6

- [ ] 5. Aplicar estilo Cobalto aos mapas atuais
  - [ ] 5.1 Criar marcadores React semânticos e acessíveis para o Google Maps do dashboard.
  - [ ] 5.2 Criar `CobaltGoogleRoute` com halo e núcleo apenas para geometria real, preservando `mapId`, câmera, filtros e eventos.
  - [ ] 5.3 Remover a possibilidade de representar uma rota por linha reta simplificada.
  - [ ] 5.4 Criar `CobaltLeafletRoute` e propriedade opcional tipada de geometria em `TravelMap.tsx`.
  - [ ] 5.5 Preservar OSM, bounds, popups e coordenadas; sem geometria, não desenhar rota.
  - [ ] 5.6 Migrar controles e superfícies adjacentes aos mapas.
  - Requisitos: 4.1–4.7

- [ ] 6. Migrar formulários administrativos
  - [ ] 6.1 Migrar motorista e passageiro para seções e primitivos compartilhados.
  - [ ] 6.2 Preservar campos, máscaras, schemas, erros de backend, senha administrativa e concorrência.
  - [ ] 6.3 Aplicar o padrão a frota, unidades, termos e configurações.
  - [ ] 6.4 Associar erros textuais aos campos e validar loading/bloqueio de submissão.
  - Requisitos: 5.1–5.5

- [ ] 7. Completar páginas e remover resíduos visuais
  - [ ] 7.1 Migrar páginas restantes usando os componentes compartilhados.
  - [ ] 7.2 Substituir cores genéricas/literais nas áreas migradas e manter ícones de carro.
  - [ ] 7.3 Remover CSS antigo somente após confirmar ausência de consumidores.
  - Requisitos: 1.4–1.6, 6.1–6.3

- [ ] 8. Testar e validar a implementação
  - [ ] 8.1 Testar variantes, loading, foco, mensagens e acessibilidade dos primitivos.
  - [ ] 8.2 Testar sidebar/permissões, estados do dashboard e fluxos dos formulários.
  - [ ] 8.3 Testar duas camadas de rota, mesmos pontos e ausência de traço sem geometria nos dois provedores.
  - [ ] 8.4 Executar `tsc -b`, build de produção e suíte, comparando com a baseline documentada.
  - Requisitos: 7.1–7.4
