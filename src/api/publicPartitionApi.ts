import { fetchProtected } from './authApi'

export interface PublicPartition {
  partitionId: string
  name: string
  identifier: string
  acronym: string
  departments: string
  categoryId: string | null
  categoryTitle: string | null
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
  categoryId: string | null
  categoryTitle: string | null
  address: PublicPartitionAddress
}

export interface CreatePartitionInput {
  name: string
  identifier: string
  acronym: string
  departments: string[]
  categoryId: string
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
  categoryId: string
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

export type CreatePartitionResult =
  | { ok: true; data: PublicPartitionDetail }
  | { ok: false; status: number; message: string }

export type UpdatePartitionResult =
  | { ok: true; data: PublicPartitionDetail }
  | { ok: false; status: number; message: string }

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
  return { ok: false, status: result.status, message: 'Erro ao criar unidade. Tente novamente.' }
}

export async function updatePartition(token: string, partitionId: string, input: UpdatePartitionInput): Promise<UpdatePartitionResult> {
  const result = await fetchProtected<PublicPartitionDetail>(`/api/public-partitions/${partitionId}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao atualizar unidade. Tente novamente.' }
}

export async function deletePartition(token: string, partitionId: string): Promise<DeletePartitionResult> {
  const result = await fetchProtected<unknown>(`/api/public-partitions/${partitionId}`, token, {
    method: 'DELETE',
  })
  if (result.ok) return { ok: true }
  return { ok: false, status: result.status, message: 'Erro ao excluir unidade. Tente novamente.' }
}

export interface DepartmentOption {
  departmentId: string
  name: string
}

export type FetchDepartmentsResult =
  | { ok: true; data: DepartmentOption[] }
  | { ok: false; status: number; message: string }

export async function fetchDepartments(token: string): Promise<FetchDepartmentsResult> {
  const result = await fetchProtected<DepartmentOption[]>('/api/departments', token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar departamentos. Tente novamente.' }
}

