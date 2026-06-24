import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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

  const { data: statsData, loading: statsLoading, error: statsError, retry: statsRetry } =
    useDashboardData()

  const { data: mapData, loading: mapLoading, error: mapError, retry: mapRetry } =
    useMapData()

  const [mapFilter, setMapFilter] = useState<FilterType>('all')

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
        <DashboardViewSelector activeView={activeView} onChange={handleViewChange} />
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
              onApprove={statsData.handleApprove}
              onReject={statsData.handleReject}
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
          <MapFilterTags active={mapFilter} onChange={setMapFilter} />

          {mapLoading ? (
            <MapSkeleton />
          ) : mapError ? (
            <ErrorBanner message={mapError} onRetry={mapRetry} />
          ) : (
            <DashboardMap
              users={mapData?.onlineUsers ?? []}
              travels={mapData?.todayTravels ?? []}
              activeFilter={mapFilter}
            />
          )}
        </div>
      )}
    </div>
  )
}
