import { fetchProtected } from './authApi'

export interface PublicPartition {
  partitionId: string
  name: string
  identifier: string
  acronym: string
  departments: string
  categoryIds: string[]
  categoryTitles: string[]
}

export interface PublicPartitionAddress {
  addressId: string
  lineOne: string
  lineTwo: string | null
  district: string | null
  city: string
  state: string
  postalCode: string | null
  countryCode: string
}

export interface DepartmentItem {
  departmentId: string
  name: string
}

export interface PublicPartitionDetail {
  partitionId: string
  name: string
  identifier: string
  acronym: string
  departments: string
  departmentList: DepartmentItem[]
  categoryIds: string[]
  categoryTitles: string[]
  address: PublicPartitionAddress
}

export interface CreatePartitionInput {
  name: string
  identifier: string
  acronym: string
  departments: string[]
  categoryIds: string[]
  adminCode: string
  address: {
    lineOne: string
    lineTwo?: string | null
    district?: string | null
    city: string
    state: string
    postalCode?: string | null
    countryCode: string
  }
}

export interface UpdatePartitionInput {
  name: string
  identifier: string
  acronym: string
  departments: string[]
  categoryIds: string[]
  adminCode: string
  address: {
    lineOne: string
    lineTwo?: string | null
    district?: string | null
    city: string
    state: string
    postalCode?: string | null
    countryCode: string
  }
}

export type ListPartitionsResult =
  | { ok: true; data: PublicPartition[] }
  | { ok: false; status: number; message: string }

export type GetPartitionResult =
  | { ok: true; data: PublicPartitionDetail }
  | { ok: false; status: number; message: string }

const DUPLICATE_PARTITION_FIELDS = ['identifier', 'acronym'] as const
export type DuplicatePartitionField = (typeof DUPLICATE_PARTITION_FIELDS)[number]

export type CreatePartitionResult =
  | { ok: true; data: PublicPartitionDetail }
  | { ok: false; status: number; message: string; field?: DuplicatePartitionField }

export type UpdatePartitionResult =
  | { ok: true; data: PublicPartitionDetail }
  | { ok: false; status: number; message: string; field?: DuplicatePartitionField }

export type DeletePartitionResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

export async function listPartitions(token: string): Promise<ListPartitionsResult> {
  const result = await fetchProtected<PublicPartition[]>('/api/public-partitions', token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar unidades. Tente novamente.' }
}

export async function getPartition(token: string, partitionId: string): Promise<GetPartitionResult> {
  const result = await fetchProtected<PublicPartitionDetail>(`/api/public-partitions/${partitionId}`, token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar unidade. Tente novamente.' }
}

export async function createPartition(token: string, input: CreatePartitionInput): Promise<CreatePartitionResult> {
  const result = await fetchProtected<PublicPartitionDetail>('/api/public-partitions/new', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  const field = result.status === 409 && DUPLICATE_PARTITION_FIELDS.includes(result.apiField as DuplicatePartitionField)
    ? (result.apiField as DuplicatePartitionField)
    : undefined
  return {
    ok: false,
    status: result.status,
    field,
    message: result.apiMessage ?? 'Erro ao criar unidade. Tente novamente.',
  }
}

export async function updatePartition(token: string, partitionId: string, input: UpdatePartitionInput): Promise<UpdatePartitionResult> {
  const result = await fetchProtected<PublicPartitionDetail>(`/api/public-partitions/${partitionId}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  const field = result.status === 409 && DUPLICATE_PARTITION_FIELDS.includes(result.apiField as DuplicatePartitionField)
    ? (result.apiField as DuplicatePartitionField)
    : undefined
  return {
    ok: false,
    status: result.status,
    field,
    message: result.apiMessage ?? 'Erro ao atualizar unidade. Tente novamente.',
  }
}

export async function deletePartition(token: string, partitionId: string): Promise<DeletePartitionResult> {
  const result = await fetchProtected<unknown>(`/api/public-partitions/${partitionId}`, token, {
    method: 'DELETE',
  })
  if (result.ok) return { ok: true }
  return { ok: false, status: result.status, message: result.apiMessage ?? 'Erro ao excluir unidade. Tente novamente.' }
}

export interface DepartmentOption {
  departmentId: string
  name: string
}

export type FetchDepartmentsResult =
  | { ok: true; data: DepartmentOption[] }
  | { ok: false; status: number; message: string }

export type FetchPartitionDepartmentsResult =
  | { ok: true; data: DepartmentOption[] }
  | { ok: false; status: number; message: string }

export async function fetchDepartments(token: string): Promise<FetchDepartmentsResult> {
  const result = await fetchProtected<DepartmentOption[]>('/api/departments', token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar departamentos. Tente novamente.' }
}

export async function fetchPartitionDepartments(
  token: string,
  partitionId: string,
): Promise<FetchPartitionDepartmentsResult> {
  const result = await fetchProtected<DepartmentOption[]>(
    `/api/public-partitions/${partitionId}/departments`,
    token,
  )
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: 'Erro ao carregar departamentos da unidade. Tente novamente.',
  }
}

