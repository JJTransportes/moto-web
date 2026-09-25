# Análise de lacunas — Painel Web

## Estado atual

- O painel usa React, TypeScript, Tailwind 3 e componentes compartilhados próprios.
- A identidade Cobalto de `entrega/2-web` ainda não foi integrada; predominam Roboto, cores Tailwind genéricas e superfícies antigas.
- O dashboard usa Google Maps; detalhes da viagem usam Leaflet/OpenStreetMap.
- O dashboard já possui marcadores e referência a rotas, enquanto `TravelMap.tsx` mantém marcadores sem desenho de rota disponível no componente atual.
- Autenticação, permissões, formulários, modais, tabelas, estados e testes já existem e serão preservados.

## Lacunas

| Área | Lacuna | Estratégia |
|---|---|---|
| Fundação | Tokens, fontes e animações ausentes | Integrar CSS do catálogo e mapear Tailwind para variáveis |
| Estrutura | Sidebar/layout ainda no tema anterior | Migrar componentes compartilhados antes das páginas |
| Dashboard | KPIs, estados e tabela sem nova hierarquia | Reestilizar com os dados atuais |
| Mapas | Marcadores genéricos e rota sem padrão comum | Adaptadores específicos por provedor, sem trocar mapa ou geometria |
| Formulários | Padrões repetidos/inconsistentes | Consolidar campos, botões, seções e feedback |
| Cobertura | Testes acoplados ao markup atual e baseline conhecida | Atualizar testes afetados e separar falhas preexistentes |

## Alternativas avaliadas

- **Executar `liquid.js` diretamente:** rejeitado, pois mutação imperativa do DOM conflita com o ciclo do React. Os efeitos necessários serão CSS/React.
- **Substituir os mapas por uma imagem/novo provedor:** rejeitado por requisito e risco funcional.
- **Reescrever todas as páginas de uma vez:** rejeitado; a migração será por fundação e componentes compartilhados, seguida das páginas.

## Escopo técnico

Nenhum endpoint, contrato, rota, permissão, validação ou regra de negócio será alterado. Uma rota só será desenhada quando a geometria real já estiver disponível; não será criada linha reta ou rota simulada para preencher o layout.
