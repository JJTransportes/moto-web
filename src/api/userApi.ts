import { fetchProtected } from './authApi'

export interface VehicleInfo {
  vehicleId: string
  brand: string
  model: string
  year: number
  plate: string
}

export interface DriverProfile {
  driverId: string
  fullName: string
  email: string
  cpf: string | null
  cnh: string | null
  department: string | null
  vehicle: VehicleInfo | null
}

export type DriverProfileResult =
  | { ok: true; data: DriverProfile }
  | { ok: false; status: number; message: string }

export type ChangeVehicleResult =
  | { ok: true; data: VehicleInfo }
  | { ok: false; status: number; message: string }

export async function fetchDriverProfile(token: string, userId: string): Promise<DriverProfileResult> {
  const result = await fetchProtected<DriverProfile>(`/api/drivers/${userId}`, token)
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 404
      ? 'Motorista não encontrado.'
      : 'Erro ao carregar perfil do motorista. Tente novamente.',
  }
}

export async function changeDriverVehicle(
  token: string,
  driverId: string,
  vehicleId: string,
): Promise<ChangeVehicleResult> {
  const result = await fetchProtected<VehicleInfo>(`/api/drivers/${driverId}/vehicle`, token, {
    method: 'PUT',
    body: JSON.stringify({ vehicleId }),
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 404
      ? 'Veículo não encontrado.'
      : result.status === 409
        ? 'Este veículo já está associado a outro motorista.'
        : 'Erro ao alterar veículo. Tente novamente.',
  }
}

export interface AddressCommand {
  lineOne: string
  lineTwo?: string | null
  district?: string | null
  city: string
  state: string
  postalCode?: string | null
  countryCode: string
}

export interface CreatePassengerRequest {
  fullName: string
  cpf: string
  rg: string
  registration: string
  birthdate: string
  address: AddressCommand
  department: string
  publicPartitionId: string
  email: string
  initialPassword: string
  adminCode: string
}

export interface CreateDriverRequest {
  fullName: string
  cpf: string
  rg: string
  registration: string
  cnh: string
  birthdate: string
  address: AddressCommand
  department: string
  email: string
  initialPassword: string
  adminCode: string
  vehicleId: string
}

export type UserCreationResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; message: string }

async function createUser<TBody>(
  endpoint: string,
  token: string,
  body: TBody,
): Promise<UserCreationResult> {
  const result = await fetchProtected<{ userId: string }>(endpoint, token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (result.ok) return { ok: true, userId: result.data.userId }
  return {
    ok: false,
    status: result.status,
    message: result.status === 401
      ? 'Código do administrador inválido.'
      : result.status === 409
        ? 'Dados duplicados. Verifique CPF, e-mail ou CNH.'
        : 'Erro ao criar usuário. Tente novamente.',
  }
}

export const createPassenger = (token: string, body: CreatePassengerRequest) =>
  createUser('/api/passengers', token, body)

export const createDriver = (token: string, body: CreateDriverRequest) =>
  createUser('/api/drivers', token, body)

