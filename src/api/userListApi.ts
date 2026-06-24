import { fetchProtected } from './authApi'

export interface DriverListItem {
  driverId: string
  userId: string
  fullName: string
  email: string
  cpf: string
  rg: string
  birthdate: string
  department: string | null
  cnh: string
  access: string
  city: string
  state: string
  createdAt: string
  isActive: boolean
  categoryTitle: string | null
  travelCount: number
}

export interface PassengerListItem {
  passengerId: string
  userId: string
  fullName: string
  email: string
  cpf: string
  rg: string
  birthdate: string
  department: string
  publicPartitionId: string
  publicPartitionName: string
  access: string
  city: string
  state: string
  createdAt: string
  isActive: boolean
  solicitationCount: number
}

export interface PaginatedDriverListResponse {
  items: DriverListItem[]
  page: number
  pageSize: number
  totalCount: number
}

export interface PaginatedPassengerListResponse {
  items: PassengerListItem[]
  page: number
  pageSize: number
  totalCount: number
}

export type ListResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

function buildUrl(base: string, page: number, pageSize: number, search?: string): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (search) {
    params.set('search', search)
  }
  return `${base}?${params.toString()}`
}

export async function listDrivers(
  token: string,
  page: number,
  pageSize: number,
  search?: string,
): Promise<ListResult<PaginatedDriverListResponse>> {
  const url = buildUrl('/api/drivers', page, pageSize, search)
  const result = await fetchProtected<PaginatedDriverListResponse>(url, token)

  if (result.ok) {
    return { ok: true, data: result.data }
  }

  return {
    ok: false,
    status: result.status,
    message: result.status === 0
      ? 'Erro de conexão. Tente novamente.'
      : 'Erro ao carregar motoristas. Tente novamente.',
  }
}

export async function listPassengers(
  token: string,
  page: number,
  pageSize: number,
  search?: string,
): Promise<ListResult<PaginatedPassengerListResponse>> {
  const url = buildUrl('/api/passengers', page, pageSize, search)
  const result = await fetchProtected<PaginatedPassengerListResponse>(url, token)

  if (result.ok) {
    return { ok: true, data: result.data }
  }

  return {
    ok: false,
    status: result.status,
    message: result.status === 0
      ? 'Erro de conexão. Tente novamente.'
      : 'Erro ao carregar passageiros. Tente novamente.',
  }
}
