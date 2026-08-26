import { fetchProtected } from './authApi'

export interface VehicleInfo {
  vehicleId: string
  brand: string
  model: string
  year: number
  plate: string
}

export interface DriverProfile {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  cnh: string | null
  vehicle: VehicleInfo | null

  // Enhanced fields
  rg?: string | null
  registration?: string | null
  address?: AddressCommand | null
  birthdate?: string
  isActive?: boolean
  access?: string
  city?: string | null
  state?: string | null
  createdAt?: string
  categoryTitle?: string | null
  travelCount?: number
  photoUrl?: string | null
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

export interface AddressCommand {
  lineOne: string
  lineTwo?: string | null
  district?: string | null
  city: string
  state: string
  postalCode?: string | null
  countryCode: string
}

export interface PassengerDepartmentDto {
  departmentId: string
  name: string
}

export interface PassengerProfile {
  passengerId: string
  userId: string
  fullName: string
  email: string
  cpf: string
  rg: string
  registration: string
  birthdate: string
  address: AddressCommand
  publicPartitionId: string
  publicPartitionName: string
  departments: PassengerDepartmentDto[]
  isActive: boolean
  createdAt: string
  solicitationCount: number
  priorityTravelsEnabled: boolean

  // Enhanced fields
  access?: string
  city?: string | null
  state?: string | null
  photoUrl?: string | null
}

export type PassengerProfileResult =
  | { ok: true; data: PassengerProfile }
  | { ok: false; status: number; message: string }

export async function fetchPassengerProfile(
  token: string,
  passengerId: string,
): Promise<PassengerProfileResult> {
  const result = await fetchProtected<PassengerProfile>(
    `/api/passengers/${passengerId}`,
    token,
  )
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message:
      result.status === 404
        ? 'Passageiro não encontrado.'
        : 'Erro ao carregar dados do passageiro. Tente novamente.',
  }
}

export type PriorityAccessResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

export async function setPriorityAccess(
  token: string,
  userId: string,
  priority: boolean,
): Promise<PriorityAccessResult> {
  const result = await fetchProtected<void>(
    `/api/passengers/${userId}/${priority}`,
    token,
    { method: 'POST' },
  )
  if (result.ok) return { ok: true }
  return {
    ok: false,
    status: result.status,
    message:
      result.status === 401
        ? 'Sessão expirada. Faça login novamente.'
        : 'Erro ao alterar acesso a pedidos prioritários. Tente novamente.',
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

export interface UpdatePassengerRequest {
  fullName: string
  cpf: string
  rg: string
  registration: string
  birthdate: string
  address: AddressCommand
  adminCode: string
}

export interface UpdateDriverRequest {
  fullName: string
  cpf: string
  rg: string
  registration: string
  cnh: string
  birthdate: string
  address: AddressCommand
  adminCode: string
  phone?: string | null
}

export type UpdatePassengerResult =
  | { ok: true; data: PassengerProfile }
  | { ok: false; status: number; message: string }

export type UpdateDriverResult =
  | { ok: true; data: DriverProfile }
  | { ok: false; status: number; message: string }

export async function updatePassenger(
  token: string,
  passengerId: string,
  body: UpdatePassengerRequest,
): Promise<UpdatePassengerResult> {
  const result = await fetchProtected<PassengerProfile>(`/api/passengers/${passengerId}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 401
      ? 'Código do administrador inválido.'
      : result.status === 409
        ? 'CPF já cadastrado para outro usuário.'
        : result.status === 404
          ? 'Passageiro não encontrado.'
          : 'Erro ao atualizar passageiro. Verifique os dados e tente novamente.',
  }
}

export async function updateDriver(
  token: string,
  userId: string,
  body: UpdateDriverRequest,
): Promise<UpdateDriverResult> {
  const result = await fetchProtected<DriverProfile>(`/api/drivers/${userId}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 401
      ? 'Código do administrador inválido.'
      : result.status === 409
        ? 'CPF ou CNH já cadastrados para outro usuário.'
        : result.status === 404
          ? 'Motorista não encontrado.'
          : 'Erro ao atualizar motorista. Verifique os dados e tente novamente.',
  }
}

export interface UserProfilePhoto {
  photoUrl: string | null
}

export type UserProfilePhotoResult =
  | { ok: true; data: UserProfilePhoto }
  | { ok: false; status: number; message: string }

export interface DeleteUserAccountResponse {
  userId: string
  message: string
}

export type DeleteUserAccountResult =
  | { ok: true; data: DeleteUserAccountResponse }
  | { ok: false; status: number; message: string }

export async function deleteUserAccount(
  token: string,
  userId: string,
  adminCode: string,
): Promise<DeleteUserAccountResult> {
  const result = await fetchProtected<DeleteUserAccountResponse>(
    `/api/users/${userId}`,
    token,
    {
      method: 'DELETE',
      body: JSON.stringify({ adminCode }),
    },
  )

  if (result.ok) return { ok: true, data: result.data }

  const message =
    result.apiMessage ??
    (result.status === 400
      ? 'Você não pode excluir sua própria conta. Solicite que outro administrador realize a exclusão.'
      : result.status === 401
        ? 'Código do administrador inválido.'
        : result.status === 404
          ? 'Usuário não encontrado.'
          : result.status === 409
            ? 'Não é possível excluir este usuário. Verifique se a conta está ativa e sem viagens em andamento.'
            : 'Erro ao excluir usuário. Tente novamente.')

  return { ok: false, status: result.status, message }
}

export interface UserStatusChangeResponse {
  userId: string
  message: string
}

export type UserStatusChangeResult =
  | { ok: true; data: UserStatusChangeResponse }
  | { ok: false; status: number; message: string }

async function changeUserStatus(
  token: string,
  userId: string,
  action: 'activate' | 'deactivate',
  adminCode: string,
): Promise<UserStatusChangeResult> {
  const result = await fetchProtected<UserStatusChangeResponse>(
    `/api/users/${userId}/${action}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({ adminCode }),
    },
  )

  if (result.ok) return { ok: true, data: result.data }

  const actionLabel = action === 'activate' ? 'ativar' : 'inativar'
  const message =
    result.apiMessage ??
    (result.status === 400
      ? `Você não pode ${actionLabel} sua própria conta.`
      : result.status === 401
        ? 'Código do administrador inválido.'
        : result.status === 404
          ? 'Usuário não encontrado.'
          : result.status === 409
            ? action === 'activate'
              ? 'Não é possível reativar: a conta já está ativa ou foi excluída permanentemente.'
              : 'Esta conta já está inativa.'
            : `Erro ao ${actionLabel} usuário. Tente novamente.`)

  return { ok: false, status: result.status, message }
}

export const activateUserAccount = (token: string, userId: string, adminCode: string) =>
  changeUserStatus(token, userId, 'activate', adminCode)

export const deactivateUserAccount = (token: string, userId: string, adminCode: string) =>
  changeUserStatus(token, userId, 'deactivate', adminCode)

export async function fetchUserProfilePhoto(
  token: string,
  userId: string,
): Promise<UserProfilePhotoResult> {
  const result = await fetchProtected<UserProfilePhoto>(
    `/api/users/${userId}/profile`,
    token,
  )
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message:
      result.status === 404
        ? 'Perfil não encontrado.'
        : 'Erro ao carregar foto do perfil. Tente novamente.',
  }
}

