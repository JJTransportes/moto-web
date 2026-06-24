# Documento de Requisitos — Registration Fix

## Introdução

Este documento define os requisitos para corrigir o fluxo de cadastro de motoristas e passageiros no painel administrativo do Moto. Atualmente ambos os formulários exibem um campo de texto livre "Departamento", porém:
- **Motoristas**: O campo "Departamento" não deve ser exibido, pois departamentos não se aplicam a motoristas.
- **Passageiros**: O campo "Departamento" deve ser carregado dinamicamente a partir da API `api/public-partitions/{id}/departments`, exibindo uma lista de departamentos vinculados à unidade pública selecionada.

## Requisitos

### Requisito 1: Remover campo "Departamento" do formulário de criação de motorista
**Objetivo:** Como um administrador criando um motorista, quero que o campo "Departamento" não seja exibido no formulário, para evitar confusão e coleta de dados desnecessários.

#### Critérios de Aceitação
1. O formulário de criação de motorista não deverá exibir o campo de texto "Departamento" ou qualquer label/sessão referente a departamento.
2. A seção "Endereço e departamento" no formulário de motorista deverá ser renomeada para "Endereço", refletindo apenas os campos de endereço.
3. Ao submeter o formulário de motorista, o campo `department` na requisição deverá ser enviado como string vazia (`""`), uma vez que o backend ainda pode esperar o campo na estrutura `CreateDriverRequest`.

### Requisito 2: Carregar departamentos via API no formulário de passageiro
**Objetivo:** Como um administrador criando um passageiro, quero que o campo "Departamento" seja populado dinamicamente a partir dos departamentos da unidade pública selecionada.

#### Critérios de Aceitação
1. Sempre que o usuário selecionar uma unidade pública no campo "Unidade pública", o sistema deverá buscar os departamentos associados via endpoint `GET /api/public-partitions/{id}/departments`.
2. O endpoint retorna uma lista de objetos contendo `departmentId`, `partitionId` e `name`.
3. O campo "Departamento" deverá ser alterado de um campo de texto livre para um campo `<select>` dropdown, populado com os departamentos retornados pela API.
4. Enquanto os departamentos estiverem sendo carregados, o dropdown deverá exibir um estado de carregamento (ex.: "Carregando departamentos..." desabilitado).
5. Caso não haja departamentos para a unidade selecionada, o dropdown deverá exibir uma mensagem informativa (ex.: "Nenhum departamento disponível").
6. Caso a API retorne erro, o sistema deverá exibir uma mensagem de erro amigável e manter o dropdown desabilitado.
7. Quando nenhuma unidade pública estiver selecionada, o campo "Departamento" deverá permanecer desabilitado com o texto "Selecione uma unidade primeiro".

### Requisito 3: Manter compatibilidade com contrato da API
**Objetivo:** Como desenvolvedor, quero que as alterações no frontend mantenham compatibilidade com o contrato existente da API.

#### Critérios de Aceitação
1. A estrutura `CreatePassengerRequest` deve continuar enviando o campo `department` como string, porém agora o valor será o `departmentId` selecionado no dropdown (não mais texto livre).
2. A estrutura `CreateDriverRequest` deve continuar enviando o campo `department` como string vazia (`""`).
3. Nenhuma alteração no backend é necessária — apenas alterações no frontend.
