import type { MapDataResponse } from '../types/map'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function fetchMapData(token: string): Promise<MapDataResponse> {
  const res = await fetch(`${BASE_URL}/api/dashboard/map-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Erro ao carregar dados do mapa: ${res.status}`)
  return (await res.json()) as MapDataResponse
}
