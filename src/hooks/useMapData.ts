import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchMapData } from '../api/mapApi'
import type { MapDataResponse } from '../types/map'

interface UseMapDataResult {
  data: MapDataResponse | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useMapData(): UseMapDataResult {
  const { token } = useAuth()
  const [data, setData] = useState<MapDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchMapData(token)
      if (!cancelledRef.current) {
        setData(result)
        setLoading(false)
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setLoading(false)
      }
    }
  }, [token])

  useEffect(() => {
    cancelledRef.current = false
    load()
    return () => { cancelledRef.current = true }
  }, [load])

  const retry = useCallback(() => { load() }, [load])

  return { data, loading, error, retry }
}
