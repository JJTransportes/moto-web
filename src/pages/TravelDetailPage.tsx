import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchTravelById, cancelTravel } from '../api/travelApi'
import type { TravelDetailResponse } from '../types/travel'
import TravelStatusBadge from '../components/travel/TravelStatusBadge'
import TravelMap from '../components/travel/TravelMap'
import CancelTravelModal from '../components/travel/CancelTravelModal'
import { ArrowLeft, MapPin, Clock, Route } from 'lucide-react'
import { decodePolyline } from '../utils/decodePolyline'

type PageStatus = 'loading' | 'loaded' | 'error' | 'notFound'

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-gray-200 rounded-xl" />
      <div className="h-[400px] bg-gray-200 rounded-lg" />
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1) + ' km'
}

function formatTime(hours: number, minutes: number): string {
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes} min`
}

export default function TravelDetailPage() {
  const { travelId } = useParams<{ travelId: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [travel, setTravel] = useState<TravelDetailResponse | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string>()

  const abortRef = useRef(false)

  const loadTravel = useCallback(async () => {
    if (!token || !travelId) return
    setPageStatus('loading')
    setErrorMessage(undefined)
    abortRef.current = false

    const result = await fetchTravelById(token, travelId)
    if (abortRef.current) return

    if (result.ok) {
      setTravel(result.data)
      setPageStatus('loaded')
    } else if (result.status === 404) {
      setPageStatus('notFound')
    } else {
      setErrorMessage(result.message)
      setPageStatus('error')
    }
  }, [token, travelId])

  useEffect(() => {
    loadTravel()
    return () => { abortRef.current = true }
  }, [loadTravel])

  const handleCancel = async (reason: string) => {
    if (!token || !travelId) return
    setCancelLoading(true)
    setCancelError(undefined)

    const result = await cancelTravel(token, travelId, reason)
    if (abortRef.current) return

    if (result.ok) {
      setTravel(result.data)
      setShowCancelModal(false)
    } else {
      setCancelError(result.message)
    }
    setCancelLoading(false)
  }

  const isTerminal = travel?.status === 'Completed' || travel?.status === 'Cancelled'

  if (pageStatus === 'loading') return <DetailSkeleton />

  if (pageStatus === 'notFound') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-800">Viagem não encontrada</h2>
        <p className="mt-2 text-gray-500">A viagem solicitada não existe ou foi removida.</p>
        <button
          onClick={() => navigate('/routes')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Corridas
        </button>
      </div>
    )
  }

  if (pageStatus === 'error') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/routes')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            <button
              onClick={loadTravel}
              className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!travel) return null

  const firstRoute = travel.routes.length > 0 ? travel.routes[0] : null
  const lastRoute = travel.routes.length > 0 ? travel.routes[travel.routes.length - 1] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/routes')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Viagem #{travel.travelId.substring(0, 8)}
          </h1>
        </div>

        {!isTerminal && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Cancelar Viagem
          </button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard label="Status">
          <TravelStatusBadge status={travel.status} />
        </InfoCard>
        <InfoCard label="Passageiro" value={travel.passengerName ?? '—'} />
        <InfoCard label="Motorista" value={travel.driverName ?? '—'} />
        <InfoCard label="Criada em" value={formatDate(travel.createdAt)} />
        <InfoCard label="Iniciada em" value={formatDate(travel.startedAt)} />
        <InfoCard label="Finalizada em" value={formatDate(travel.finishedAt)} />
        <InfoCard label="Cancelada em" value={formatDate(travel.cancelledAt)} />
        <InfoCard label="Motivo do cancelamento" value={travel.cancellationReason ?? '—'} />
      </div>

      {/* Routes */}
      {travel.routes.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Route className="h-5 w-5 text-blue-600" />
            Rotas
          </h2>
          <div className="space-y-3">
            {travel.routes.map((route, idx) => (
              <div
                key={route.routeId}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  Rota {idx + 1}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Origem:</span>
                    <p className="text-gray-800">{route.departureAddress}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Destino:</span>
                    <p className="text-gray-800">{route.destinationAddress}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {formatDistance(route.routeDestinationInMeters)}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    {formatTime(route.averageTravelTimeInHours, route.averageTravelTimeInMinutes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      {firstRoute && lastRoute && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <MapPin className="h-5 w-5 text-blue-600" />
            Mapa
          </h2>
          <TravelMap
            originLat={firstRoute.initialLatitude}
            originLng={firstRoute.initialLongitude}
            originLabel={firstRoute.departureAddress}
            destLat={lastRoute.destinationLatitude}
              destLng={lastRoute.destinationLongitude}
              destLabel={lastRoute.destinationAddress}
              route={travel.routes.flatMap((route) => {
                try {
                  return decodePolyline(route.encodedPolyline).map(
                    ({ lat, lng }): [number, number] => [lat, lng],
                  )
                } catch {
                  return []
                }
              })}
            />
        </div>
      )}

      {/* Cancel Modal */}
      <CancelTravelModal
        isOpen={showCancelModal}
        onConfirm={handleCancel}
        onCancel={() => { setShowCancelModal(false); setCancelError(undefined) }}
        loading={cancelLoading}
        error={cancelError}
      />
    </div>
  )
}

function InfoCard({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <p className="text-sm font-medium text-gray-800">{value}</p>
      )}
    </div>
  )
}
