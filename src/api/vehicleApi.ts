import { fetchProtected } from './authApi'

export interface AvailableVehicle {
  vehicleId: string
  brand: string
  model: string
  year: number
  plate: string
  categoryId: string
  categoryTitle: string | null
}

export interface Vehicle {
  vehicleId: string
  brand: string
  model: string
  year: number
  plate: string
  categoryId: string
  categoryTitle: string | null
  driverId: string | null
  driverName: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleInput {
  brand: string
  model: string
  year: number
  plate: string
  categoryId: string
  driverId?: string | null
}

export interface UpdateVehicleInput {
  brand: string
  model: string
  year: number
  plate: string
  categoryId: string
}

export type ListAvailableVehiclesResult =
  | { ok: true; data: AvailableVehicle[] }
  | { ok: false; status: number; message: string }

export type ListVehiclesResult =
  | { ok: true; data: Vehicle[] }
  | { ok: false; status: number; message: string }

export type GetVehicleResult =
  | { ok: true; data: Vehicle }
  | { ok: false; status: number; message: string }

export type CreateVehicleResult =
  | { ok: true; data: Vehicle }
  | { ok: false; status: number; message: string }

export type DeleteVehicleResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

export async function fetchAvailableVehicles(token: string): Promise<ListAvailableVehiclesResult> {
  const result = await fetchProtected<AvailableVehicle[]>('/api/vehicles/available', token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar veículos. Tente novamente.' }
}

export async function fetchVehicles(token: string): Promise<ListVehiclesResult> {
  const result = await fetchProtected<Vehicle[]>('/api/vehicles', token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar veículos. Tente novamente.' }
}

export async function fetchVehicle(token: string, vehicleId: string): Promise<GetVehicleResult> {
  const result = await fetchProtected<Vehicle>(`/api/vehicles/${vehicleId}`, token)
  if (result.ok) return { ok: true, data: result.data }
  if (result.status === 404) return { ok: false, status: 404, message: 'Veículo não encontrado.' }
  return { ok: false, status: result.status, message: 'Erro ao carregar veículo. Tente novamente.' }
}

export async function createVehicle(token: string, input: CreateVehicleInput): Promise<CreateVehicleResult> {
  const result = await fetchProtected<Vehicle>('/api/vehicles', token, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  // Sem apiMessage aqui, mensagens específicas do backend (ex: "Já existe um
  // veículo com esta placa.") ficavam trocadas por um erro genérico que não
  // dizia qual dado estava errado.
  return { ok: false, status: result.status, message: result.apiMessage ?? 'Erro ao criar veículo. Verifique os dados e tente novamente.' }
}

export async function updateVehicle(token: string, vehicleId: string, input: UpdateVehicleInput): Promise<GetVehicleResult> {
  const result = await fetchProtected<Vehicle>(`/api/vehicles/${vehicleId}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: result.apiMessage ?? 'Erro ao atualizar veículo. Verifique os dados e tente novamente.' }
}

export async function deleteVehicle(token: string, vehicleId: string): Promise<DeleteVehicleResult> {
  try {
    const BASE_URL = import.meta.env.VITE_API_URL ?? ''
    const res = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.status === 204 || res.ok) return { ok: true }
    let message = 'Erro ao excluir veículo. Tente novamente.'
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch { /* ignore */ }
    return { ok: false, status: res.status, message }
  } catch {
    return { ok: false, status: 0, message: 'Erro de conexão. Tente novamente.' }
  }
}
