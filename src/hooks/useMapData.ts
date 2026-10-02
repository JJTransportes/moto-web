import { useEffect, useState, useCallback, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useAuth } from '../auth/AuthContext'
import { fetchMapData } from '../api/mapApi'
import type { MapDataResponse } from '../types/map'

interface UseMapDataResult {
  data: MapDataResponse | null
  loading: boolean
  error: string | null
  retry: () => void
}

interface UserLocationEvent {
  userId: string
  role: 'Driver' | 'Passenger'
  latitude: number
  longitude: number
  lastUpdated: string
}

export function useMapData(): UseMapDataResult {
  const { token } = useAuth()
  const [data, setData] = useState<MapDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async (showLoading = true) => {
    if (!token) return
    if (showLoading) setLoading(true)
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
    void load()

    // SignalR moves known markers immediately. The periodic REST snapshot is
    // retained as a recovery path for missed events, API restarts and drivers
    // who entered attendance mode after this page was opened.
    const baseUrl = import.meta.env.VITE_API_URL ?? ''
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/travel-management`, {
        accessTokenFactory: () => token ?? '',
      })
      .withAutomaticReconnect([0, 1_000, 2_000, 5_000, 10_000])
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('UserLocationUpdated', (event: UserLocationEvent) => {
      let found = false
      setData((current) => {
        if (!current) return current
        const onlineUsers = current.onlineUsers.map((user) => {
          if (user.userId !== event.userId) return user
          found = true
          return {
            ...user,
            role: event.role,
            latitude: event.latitude,
            longitude: event.longitude,
            lastUpdated: event.lastUpdated,
          }
        })
        return found ? { ...current, onlineUsers } : current
      })

      if (!found) void load(false)
    })

    connection.on('UserOffline', (event: { userId: string }) => {
      setData((current) => current
        ? {
            ...current,
            onlineUsers: current.onlineUsers.filter(
              (user) => user.userId !== event.userId,
            ),
          }
        : current)
    })

    connection.onreconnected(() => { void load(false) })
    connection.start().catch(() => {
      // REST polling keeps the map available if the live connection fails.
    })

    const refreshTimer = window.setInterval(() => {
      void load(false)
    }, 30_000)

    return () => {
      cancelledRef.current = true
      window.clearInterval(refreshTimer)
      if (connection.state !== HubConnectionState.Disconnected) {
        void connection.stop()
      }
    }
  }, [load, token])

  const retry = useCallback(() => { void load() }, [load])

  return { data, loading, error, retry }
}
