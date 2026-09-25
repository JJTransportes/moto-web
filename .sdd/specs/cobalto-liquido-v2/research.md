# Pesquisa técnica — Painel Web

## Decisões

1. **CSS em camadas:** carregar `tokens.css`, `animacoes.css` e `componentes.css` nessa ordem, antes dos ajustes específicos do aplicativo. Variáveis serão expostas ao Tailwind para migração gradual.
2. **Fontes locais:** reutilizar os arquivos variáveis Sora e Plus Jakarta Sans já fornecidos no workspace, evitando dependência de rede em produção.
3. **React em vez de scripts imperativos:** não importar `liquid.js`; estados de pressão, ripple e movimento reduzido serão implementados via classes CSS e props dos componentes React.
4. **Ícones existentes:** manter a biblioteca React atual e padronizar tamanho/cor; não injetar sprite por script quando isso duplicar a solução.
5. **Google Maps:** renderizar halo e núcleo com duas polylines nativas somente para geometrias reais disponíveis e manter o `mapId`, câmera e eventos atuais.
6. **Leaflet:** adicionar duas `<Polyline>` com as mesmas posições quando o contrato do componente receber uma rota; manter `TileLayer` OSM, bounds e marcadores.
7. **Migração de baixo para cima:** tokens → primitivos → layout → dashboard/mapas → formulários → demais páginas.

## Riscos e mitigação

- CSS global pode afetar telas não migradas: seletores novos serão escopados e a migração ocorrerá por componente.
- Blur por item degrada listas: vidro real fica restrito a overlays; listas usam superfície opaca.
- Duas rotas aumentam custo de desenho: reutilizar a mesma matriz de coordenadas e evitar recomputação.
- A suíte possui falhas baseline registradas: comparar antes/depois e não classificar falha antiga como regressão.
