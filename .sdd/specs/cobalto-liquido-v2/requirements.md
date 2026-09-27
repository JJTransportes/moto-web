# Requisitos — Cobalto Líquido v2 no Painel Administrativo

## Introdução

Aplicar ao painel React a linguagem visual Cobalto Líquido v2 fornecida em `entrega/`, preservando integralmente autenticação, permissões, rotas, contratos de API, validações e fluxos administrativos. O mapa atual será mantido; apenas os componentes de interface ao redor dele poderão receber o novo estilo.

## Requisitos

### Requisito 1: Fundação visual

**Objetivo:** Como administrador, quero uma interface consistente com os aplicativos móveis, para reconhecer o ecossistema como um único produto.

#### Critérios de aceitação

1. The painel web shall incorporar os tokens, componentes e animações necessários do Cobalto Líquido v2 em uma integração compatível com React e Tailwind 3.
2. The painel web shall carregar `tokens.css`, `animacoes.css` e `componentes.css` na ordem definida pelo design system.
3. The painel web shall usar Sora em títulos e números e Plus Jakarta Sans na interface.
4. The painel web shall usar os tokens do design system no lugar de cores Tailwind genéricas ou hexadecimais nas telas migradas.
5. The painel web shall usar tema exclusivamente claro.
6. The painel web shall preservar o uso de ícones de carro, nunca motocicleta.

### Requisito 2: Estrutura e navegação

**Objetivo:** Como administrador, quero navegar pelo painel com uma hierarquia visual clara.

#### Critérios de aceitação

1. When o painel autenticado for exibido, the painel web shall apresentar sidebar e área principal no padrão visual Cobalto Líquido v2.
2. The sidebar shall distinguir item ativo com texto, ícone e estado visual, não apenas por cor.
3. The sidebar shall preservar todas as rotas, permissões por papel, agrupamentos e ação de sair existentes.
4. The painel web shall preservar comportamento responsivo e permitir rolagem sem ocultar conteúdo operacional.

### Requisito 3: Dashboard

**Objetivo:** Como administrador, quero identificar rapidamente os indicadores prioritários e as pendências operacionais.

#### Critérios de aceitação

1. When os dados forem carregados, the dashboard shall destacar o KPI principal em safira e apresentar os demais KPIs em superfícies claras.
2. The dashboard shall manter exatamente os dados disponibilizados pelas APIs atuais, sem criar métricas ilustrativas do catálogo.
3. The dashboard shall estilizar a tabela de corridas por unidade com a hierarquia e as barras proporcionais do design system quando os dados correspondentes existirem.
4. If não houver cadastros pendentes, the dashboard shall apresentar estado vazio coerente com o design system.
5. While os dados estiverem carregando, the dashboard shall apresentar skeletons coerentes com a nova linguagem.
6. If o carregamento falhar, the dashboard shall preservar mensagem de causa e ação de tentar novamente.

### Requisito 4: Mapa administrativo preservado com rota Cobalto

**Objetivo:** Como responsável pelo produto, quero conservar os mapas já implementados e aplicar a identidade Cobalto às rotas e marcadores.

#### Critérios de aceitação

1. The painel web shall manter os provedores atuais de cada mapa, incluindo Google Maps e Leaflet/OpenStreetMap onde já utilizados.
2. The painel web shall preservar filtros, câmera, coordenadas, atualização de dados e comportamento funcional existentes.
3. When uma rota estiver disponível, the painel web shall desenhar a mesma geometria em duas camadas: halo cobalto translúcido e linha cobalto sólida acima dele, usando a API própria de cada provedor.
4. Where marcadores de usuário, veículo, origem ou destino existirem, the painel web shall aplicar cores e contraste coerentes com o design system sem alterar suas coordenadas ou significado.
5. The painel web shall manter ruas, rótulos e referências do mapa-base legíveis, sem reproduzir os quarteirões preenchidos da ilustração.
6. Where controles, filtros ou indicadores forem exibidos sobre ou ao redor do mapa, the painel web shall estilizar essas superfícies com os componentes do design system.
7. The painel web shall not substituir o mapa real por imagem nem recalcular rotas no cliente.

### Requisito 5: Formulários administrativos

**Objetivo:** Como administrador, quero formulários claros e consistentes para reduzir erros de cadastro e edição.

#### Critérios de aceitação

1. When um formulário de motorista ou passageiro for exibido, the painel web shall organizar os campos existentes em seções visuais coerentes, sem criar novos campos.
2. The painel web shall preservar máscaras, validações, mensagens de backend, confirmação por senha administrativa e controle de concorrência existentes.
3. If um campo for inválido, the painel web shall apresentar causa textual próxima ao campo.
4. While um envio estiver em andamento, the painel web shall mostrar carregamento e impedir envio duplicado.
5. The painel web shall aplicar o mesmo padrão progressivamente aos formulários de frota, unidades, termos e configurações sem alterar seu comportamento.

### Requisito 6: Componentes compartilhados e estados

**Objetivo:** Como usuário, quero feedback uniforme em todo o painel.

#### Critérios de aceitação

1. The painel web shall padronizar botões, campos, cards, tabelas, badges, modais, toasts, skeletons, estados vazios e mensagens de erro.
2. The painel web shall limitar cada tela a uma ação primária visual, mantendo ações destrutivas no tom de perigo.
3. The painel web shall usar blur real somente onde houver benefício visual, evitando blur por item em listas grandes.
4. While a preferência de movimento reduzido estiver ativa, the painel web shall desabilitar ou reduzir animações não essenciais.
5. The painel web shall preservar `aria-label`, foco visível, navegação por teclado e contraste mínimo AA.

### Requisito 7: Compatibilidade e validação

**Objetivo:** Como equipe de desenvolvimento, quero aplicar o design sem regressões funcionais.

#### Critérios de aceitação

1. The painel web shall preservar rotas, APIs, autenticação, autorização e regras de negócio existentes.
2. When a implementação for concluída, the painel web shall passar em `tsc -b` e no build de produção.
3. When a implementação for concluída, the painel web shall executar a suíte de testes e não introduzir falhas além da baseline previamente documentada.
4. The painel web shall receber testes atualizados para componentes compartilhados e telas-chave cujo markup mudar materialmente.

## Fora de escopo

- Trocar os provedores, o cálculo ou o comportamento funcional dos mapas.
- Reproduzir o mapa ilustrativo preenchido da referência.
- Criar botão de ligação.
- Criar avaliação de motorista.
- Criar atalhos de destino.
- Criar alteração de destino.
- Alterar backend, banco, endpoints, contratos, regras de negócio ou permissões.
