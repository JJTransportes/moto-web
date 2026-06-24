import { fetchProtected } from './authApi'
import type {
  PaginatedTravelAdminList,
  TravelDetailResponse,
  TravelListParams,
} from '../types/travel'

const buildQuery = (params: TravelListParams): string => {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.pageSize) sp.set('pageSize', String(params.pageSize))
  if (params.status?.length) {
    params.status.forEach(s => sp.append('status', s))
  }
  if (params.createdFrom) sp.set('createdFrom', params.createdFrom)
  if (params.createdTo) sp.set('createdTo', params.createdTo)
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export type FetchTravelsResult =
  | { ok: true; data: PaginatedTravelAdminList }
  | { ok: false; status: number; message: string }

export type FetchTravelByIdResult =
  | { ok: true; data: TravelDetailResponse }
  | { ok: false; status: number; message: string }

export type CancelTravelResult =
  | { ok: true; data: TravelDetailResponse }
  | { ok: false; status: number; message: string }

export async function fetchTravels(
  token: string,
  params: TravelListParams = {},
): Promise<FetchTravelsResult> {
  const result = await fetchProtected<PaginatedTravelAdminList>(
    `/api/travels${buildQuery(params)}`,
    token,
  )
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar viagens. Tente novamente.' }
}

export async function fetchTravelById(
  token: string,
  travelId: string,
): Promise<FetchTravelByIdResult> {
  const result = await fetchProtected<TravelDetailResponse>(
    `/api/travels/${travelId}`,
    token,
  )
  if (result.ok) return { ok: true, data: result.data }
  if (result.status === 404) return { ok: false, status: 404, message: 'Viagem não encontrada.' }
  return { ok: false, status: result.status, message: 'Erro ao carregar detalhes da viagem.' }
}

export async function cancelTravel(
  token: string,
  travelId: string,
  reason: string,
): Promise<CancelTravelResult> {
  const result = await fetchProtected<TravelDetailResponse>(
    `/api/travels/${travelId}/cancel`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
  )
  if (result.ok) return { ok: true, data: result.data }
  if (result.status === 400) {
    return { ok: false, status: 400, message: 'Motivo do cancelamento é obrigatório.' }
  }
  if (result.status === 409) {
    return { ok: false, status: 409, message: 'Não é possível cancelar uma viagem neste status.' }
  }
  return { ok: false, status: result.status, message: 'Erro ao cancelar viagem. Tente novamente.' }
}
