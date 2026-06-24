import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchPartitionTravelReport } from '../api/reportApi'
import type { PartitionTravelReportItem } from '../types/reports'

interface UsePartitionTravelReportResult {
  data: PartitionTravelReportItem[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePartitionTravelReport(
  startDate: string | null,
  endDate: string | null,
): UsePartitionTravelReportResult {
  const { token } = useAuth()
  const [data, setData] = useState<PartitionTravelReportItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchId = useRef(0)

  const doFetch = useCallback(async () => {
    if (!token || !startDate || !endDate) return

    const id = ++fetchId.current

    if (data === null) {
      setLoading(true)
    }
    setError(null)

    try {
      const items = await fetchPartitionTravelReport(token, startDate, endDate)
      if (id === fetchId.current) {
        setData(items)
      }
    } catch (err: unknown) {
      if (id === fetchId.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar relatório.')
      }
    } finally {
      if (id === fetchId.current) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, startDate, endDate])

  useEffect(() => {
    doFetch()
  }, [doFetch])

  const refetch = useCallback(() => {
    doFetch()
  }, [doFetch])

  return { data, loading, error, refetch }
}
