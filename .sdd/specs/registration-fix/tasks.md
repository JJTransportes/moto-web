# Plano de Implementação — Registration Fix

## Tarefas

- [x] 1. Adicionar função `fetchPartitionDepartments` na API layer
  - Adicionar interface `Department` com `departmentId`, `partitionId`, `name`
  - Adicionar tipo `FetchPartitionDepartmentsResult`
  - Implementar `fetchPartitionDepartments(token, partitionId)` em `publicPartitionApi.ts`
  - Endpoint: `GET /api/public-partitions/{partitionId}/departments`
  - _Requisitos: 2.1, 2.2_

- [x] 2. Remover campo "Departamento" do formulário de motorista (P)
  - Renomear heading da seção de "Endereço e departamento" para "Endereço"
  - Remover `<FormField id="department" ...>` do JSX
  - Remover `e.department = validateRequired(...)` da função `validate()`
  - No `handleConfirm`, alterar `department: form.department` para `department: ''`
  - _Requisitos: 1.1, 1.2, 1.3, 3.2_

- [x] 3. Implementar dropdown dinâmico de departamentos no formulário de passageiro (P)
  - Adicionar estados: `departments`, `departmentsLoading`, `departmentsError`
  - Adicionar `useEffect` que dispara quando `publicPartitionId` muda, chamando `fetchPartitionDepartments`
  - Substituir `<FormField id="department" type="text">` por lógica condicional com `<FormField type="select">`:
    - Sem unidade selecionada → desabilitado com placeholder "Selecione uma unidade primeiro"
    - Loading → desabilitado com placeholder "Carregando departamentos..."
    - Erro → mensagem de erro
    - Nenhum departamento → mensagem informativa
    - Departamentos carregados → dropdown populado
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1_
