import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  fetchStats,
  fetchPartitionsTravels,
  fetchPendingRegistrations,
  approveRegistration,
  rejectRegistration,
} from '../api/dashboardApi'
import type { DashboardData } from '../types/dashboard'

interface UseDashboardDataResult {
  data: DashboardData | null
  loading: boolean
  error: string | null
  retry: () => void
  handleApprove: (id: string) => Promise<void>
  handleReject: (id: string, reason?: string) => Promise<void>
}

export function useDashboardData(): UseDashboardDataResult {
  const { token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Não autenticado.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      fetchStats(token),
      fetchPartitionsTravels(token),
      fetchPendingRegistrations(token),
    ])
      .then(([stats, partitions, regsResult]) => {
        if (!cancelled) {
          setData({
            stats,
            partitions,
            pendingRegistrations: regsResult.items,
          })
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Erro ao carregar dados do dashboard.'
          setError(message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, retryCount])

  const handleApprove = useCallback(
    async (id: string) => {
      if (!token) return
      await approveRegistration(token, id)
      // Refresh the list
      try {
        const regsResult = await fetchPendingRegistrations(token)
        setData((prev) =>
          prev ? { ...prev, pendingRegistrations: regsResult.items } : prev
        )
      } catch {
        // ignore refresh errors
      }
    },
    [token]
  )

  const handleReject = useCallback(
    async (id: string, reason?: string) => {
      if (!token) return
      await rejectRegistration(token, id, reason)
      try {
        const regsResult = await fetchPendingRegistrations(token)
        setData((prev) =>
          prev ? { ...prev, pendingRegistrations: regsResult.items } : prev
        )
      } catch {
        // ignore refresh errors
      }
    },
    [token]
  )

  return { data, loading, error, retry, handleApprove, handleReject }
}
