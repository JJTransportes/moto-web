import { useState, useCallback } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import type { FilterType, OnlineUserDto, TodayTravelDto } from '../../types/map'
import MapInfoWindowContent from './MapInfoWindowContent'
import CobaltGoogleRoute from './CobaltGoogleRoute'

const JACAREI_CENTER = { lat: -23.305, lng: -45.966 }
const DEFAULT_ZOOM = 13

interface DashboardMapProps {
  users: OnlineUserDto[]
  travels: TodayTravelDto[]
  activeFilter: FilterType
}

function FitBoundsOnData({ users, travels, activeFilter }: DashboardMapProps) {
  const map = useMap()

  // Fit bounds when data changes
  const bounds = new google.maps.LatLngBounds()
  let hasPoints = false

  if (activeFilter === 'all' || activeFilter === 'drivers' || activeFilter === 'passengers') {
    const filteredUsers =
      activeFilter === 'drivers'
        ? users.filter((u) => u.role === 'Driver')
        : activeFilter === 'passengers'
          ? users.filter((u) => u.role === 'Passenger')
          : users

    for (const u of filteredUsers) {
      bounds.extend({ lat: u.latitude, lng: u.longitude })
      hasPoints = true
    }
  }

  if (activeFilter === 'all' || activeFilter === 'travels') {
    for (const t of travels) {
      bounds.extend({ lat: t.initialLatitude, lng: t.initialLongitude })
      bounds.extend({ lat: t.destinationLatitude, lng: t.destinationLongitude })
      hasPoints = true
    }
  }

  if (hasPoints) {
    map?.fitBounds(bounds, 50)
  }

  return null
}

export default function DashboardMap({ users, travels, activeFilter }: DashboardMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'user' | 'travel'
    data: OnlineUserDto | TodayTravelDto
    position: { lat: number; lng: number }
  } | null>(null)

  const showUsers = activeFilter === 'all' || activeFilter === 'drivers' || activeFilter === 'passengers'
  const showTravels = activeFilter === 'all' || activeFilter === 'travels'

  const visibleUsers = showUsers
    ? activeFilter === 'drivers'
      ? users.filter((u) => u.role === 'Driver')
      : activeFilter === 'passengers'
        ? users.filter((u) => u.role === 'Passenger')
        : users
    : []

  const visibleTravels = showTravels ? travels : []

  const handleUserClick = useCallback(
    (user: OnlineUserDto) => {
      setSelectedMarker({
        type: 'user',
        data: user,
        position: { lat: user.latitude, lng: user.longitude },
      })
    },
    [],
  )

  const handleTravelClick = useCallback(
    (travel: TodayTravelDto, lat: number, lng: number) => {
      setSelectedMarker({
        type: 'travel',
        data: travel,
        position: { lat, lng },
      })
    },
    [],
  )

  const apiKey = import.meta.env.VITE_MAPS_API_KEY ?? ''

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="mo-surface flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Google Maps API key não configurada</p>
          <p className="text-sm text-slate-400 mt-1">
            Configure VITE_MAPS_API_KEY no arquivo .env
          </p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[600px] w-full overflow-hidden rounded-[26px] border border-[var(--border-default)] shadow-moto">
        <Map
          defaultCenter={JACAREI_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId="moto-dashboard-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBoundsOnData users={users} travels={travels} activeFilter={activeFilter} />

          {/* User markers */}
          {visibleUsers.map((user) => {
            const isStale =
              new Date().getTime() - new Date(user.lastUpdated).getTime() > 5 * 60 * 1000
            const pinColor = user.role === 'Driver' ? '#1F4FE0' : '#95C11F'
            return (
              <AdvancedMarker
                key={`user-${user.userId}`}
                position={{ lat: user.latitude, lng: user.longitude }}
                onClick={() => handleUserClick(user)}
              >
                <Pin
                  background={isStale ? '#A2ADC4' : pinColor}
                  glyphColor="#fff"
                  borderColor={isStale ? '#5A6784' : pinColor}
                />
              </AdvancedMarker>
            )
          })}

          {/* Travel start/destination markers + polylines */}
          {visibleTravels.map((travel) => {
            return (
              <div key={`travel-${travel.travelId}`}>
                <AdvancedMarker
                  position={{ lat: travel.initialLatitude, lng: travel.initialLongitude }}
                  onClick={() =>
                    handleTravelClick(travel, travel.initialLatitude, travel.initialLongitude)
                  }
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sinal text-xs font-bold text-[var(--text-primary)] shadow-md"
                    title="Origem"
                  >
                    A
                  </div>
                </AdvancedMarker>
                <AdvancedMarker
                  position={{ lat: travel.destinationLatitude, lng: travel.destinationLongitude }}
                  onClick={() =>
                    handleTravelClick(travel, travel.destinationLatitude, travel.destinationLongitude)
                  }
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-cobalto text-xs font-bold text-white shadow-md"
                    title="Destino"
                  >
                    B
                  </div>
                </AdvancedMarker>
                {travel.encodedPolyline && (
                  <CobaltGoogleRoute encodedPolyline={travel.encodedPolyline} />
                )}
              </div>
            )
          })}

          {/* Info window */}
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <MapInfoWindowContent
                type={selectedMarker.type}
                data={selectedMarker.data}
              />
            </InfoWindow>
          )}

          {/* Empty state */}
          {visibleUsers.length === 0 && visibleTravels.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="mo-map-overlay px-6 py-4">
                <p className="text-slate-600 font-medium">
                  {activeFilter === 'travels'
                    ? 'Nenhuma viagem registrada hoje'
                    : 'Nenhum usuário ativo no momento'}
                </p>
              </div>
            </div>
          )}
        </Map>
      </div>
    </APIProvider>
  )
}
