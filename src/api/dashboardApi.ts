import type { StatsResponse, PartitionTravelSummary, PendingRegistration } from '../types/dashboard'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function fetchStats(token: string, signal?: AbortSignal): Promise<StatsResponse> {
  const res = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal,
  })

  if (!res.ok) {
    throw new Error(`Erro ao carregar estatísticas: ${res.status}`)
  }

  return (await res.json()) as StatsResponse
}

export async function fetchPartitionsTravels(token: string, signal?: AbortSignal): Promise<PartitionTravelSummary[]> {
  const res = await fetch(`${BASE_URL}/api/dashboard/partitions-travels`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal,
  })

  if (!res.ok) {
    throw new Error(`Erro ao carregar dados por unidade: ${res.status}`)
  }

  return (await res.json()) as PartitionTravelSummary[]
}

export async function fetchPendingRegistrations(
  token: string,
  page = 1,
  pageSize = 10,
  signal?: AbortSignal
): Promise<{ items: PendingRegistration[]; totalCount: number }> {
  const res = await fetch(
    `${BASE_URL}/api/registrations?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    }
  )

  if (!res.ok) {
    throw new Error(`Erro ao carregar cadastros pendentes: ${res.status}`)
  }

  return (await res.json()) as { items: PendingRegistration[]; totalCount: number }
}

export async function approveRegistration(
  token: string,
  id: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/registrations/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ?? `Erro ao aprovar cadastro: ${res.status}`
    )
  }
}

export async function rejectRegistration(
  token: string,
  id: string,
  reason?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/registrations/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: reason ? JSON.stringify({ rejectionReason: reason }) : undefined,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: string }).error ?? `Erro ao rejeitar cadastro: ${res.status}`
    )
  }
}
