import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, X } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useMapData } from '../hooks/useMapData'
import StatsCards from '../components/dashboard/StatsCards'
import PendingRegistrationsTable from '../components/dashboard/PendingRegistrationsTable'
import PartitionsTravelsTable from '../components/dashboard/PartitionsTravelsTable'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import DashboardViewSelector from '../components/dashboard/DashboardViewSelector'
import MapFilterTags from '../components/dashboard/MapFilterTags'
import DashboardMap from '../components/dashboard/DashboardMap'
import MapSkeleton from '../components/dashboard/MapSkeleton'
import ErrorBanner from '../components/dashboard/ErrorBanner'
import type { FilterType } from '../types/map'

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeView =
    searchParams.get('view') === 'map' ? 'map' : 'stats'

  const { data: statsData, loading: statsLoading, error: statsError, retry: statsRetry, handleApprove, handleReject } =
    useDashboardData()

  const { data: mapData, loading: mapLoading, error: mapError, retry: mapRetry } =
    useMapData()

  const [mapFilter, setMapFilter] = useState<FilterType>('all')
  // Cada clique em "Desfocar" incrementa o contador; o mapa limpa o foco ao vê-lo mudar.
  const [focusResetSignal, setFocusResetSignal] = useState(0)

  const handleViewChange = (view: 'stats' | 'map') => {
    if (view === 'map') {
      setSearchParams({ view: 'map' })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          {activeView === 'stats' && (
            <button
              type="button"
              onClick={statsRetry}
              disabled={statsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Atualizar dados do dashboard"
            >
              <RefreshCw
                className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {statsLoading ? 'Atualizando...' : 'Atualizar dados'}
            </button>
          )}
          <DashboardViewSelector activeView={activeView} onChange={handleViewChange} />
        </div>
      </div>

      {activeView === 'stats' ? (
        // ─── Dados Gerais View ──────────────────────────────
        statsLoading ? (
          <DashboardSkeleton />
        ) : statsError ? (
          <div className="space-y-6">
            <ErrorBanner message={statsError} onRetry={statsRetry} />
          </div>
        ) : !statsData ? (
          <ErrorBanner
            message="Não foi possível carregar os dados."
            onRetry={statsRetry}
          />
        ) : (
          <div className="space-y-8">
            <StatsCards stats={statsData.stats} />
            <PendingRegistrationsTable
              items={statsData.pendingRegistrations}
              loading={false}
              error={null}
              onApprove={handleApprove}
              onReject={handleReject}
              onRetry={statsRetry}
            />
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                Corridas por Unidade
              </h2>
              <PartitionsTravelsTable partitions={statsData.partitions} />
            </section>
          </div>
        )
      ) : (
        // ─── Map View ──────────────────────────────────────
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MapFilterTags active={mapFilter} onChange={setMapFilter} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFocusResetSignal((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
                aria-label="Desfocar viagem"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Desfocar
              </button>
              <button
                type="button"
                onClick={mapRetry}
                disabled={mapLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Atualizar mapa"
              >
                <RefreshCw
                  className={`h-4 w-4 ${mapLoading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {mapLoading ? 'Atualizando...' : 'Atualizar mapa'}
              </button>
            </div>
          </div>

          {mapLoading ? (
            <MapSkeleton />
          ) : mapError ? (
            <ErrorBanner message={mapError} onRetry={mapRetry} />
          ) : (
            <DashboardMap
              users={mapData?.onlineUsers ?? []}
              travels={mapData?.todayTravels ?? []}
              activeFilter={mapFilter}
              focusResetSignal={focusResetSignal}
            />
          )}
        </div>
      )}
    </div>
  )
}
