import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { CarFront, UserRound } from 'lucide-react'
import type { FilterType, OnlineUserDto, TodayTravelDto } from '../../types/map'
import MapInfoWindowContent from './MapInfoWindowContent'
import CobaltGoogleRoute from './CobaltGoogleRoute'
import UserAvatar from '../UserAvatar'

const JACAREI_CENTER = { lat: -23.305, lng: -45.966 }
const DEFAULT_ZOOM = 13
const MARKER_ANIMATION_MS = 4_500
const GPS_JITTER_METERS = 3
const MAX_PLAUSIBLE_SPEED_METERS_PER_SECOND = 70

type MapPosition = { lat: number; lng: number }

function distanceInMeters(from: MapPosition, to: MapPosition) {
  const earthRadius = 6_371_000
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = toRadians(to.lat - from.lat)
  const longitudeDelta = toRadians(to.lng - from.lng)
  const fromLatitude = toRadians(from.lat)
  const toLatitude = toRadians(to.lat)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function bearingInDegrees(from: MapPosition, to: MapPosition) {
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const fromLatitude = toRadians(from.lat)
  const toLatitude = toRadians(to.lat)
  const longitudeDelta = toRadians(to.lng - from.lng)
  const y = Math.sin(longitudeDelta) * Math.cos(toLatitude)
  const x =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function nearestHeading(current: number, target: number) {
  const delta = ((target - current + 540) % 360) - 180
  return current + delta
}

function smoothStep(progress: number) {
  return progress * progress * (3 - 2 * progress)
}

interface DashboardMapProps {
  users: OnlineUserDto[]
  travels: TodayTravelDto[]
  activeFilter: FilterType
}

function FitBoundsOnData({ users, travels, activeFilter }: DashboardMapProps) {
  const map = useMap()
  const membershipKey = useMemo(
    () => `${activeFilter}|${users.map((u) => u.userId).sort().join(',')}|${travels
      .map((t) => t.travelId)
      .sort()
      .join(',')}`,
    [activeFilter, travels, users],
  )

  // Reframe only when markers enter/leave the map or the filter changes.
  // Re-fitting on every 5-second GPS update makes the map visibly jump and
  // fights the marker animation.
  useEffect(() => {
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

    if (hasPoints) map?.fitBounds(bounds, 50)
  // membershipKey intentionally represents membership rather than coordinates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, membershipKey])

  return null
}

interface AnimatedUserMarkerProps {
  user: OnlineUserDto
  onClick: (user: OnlineUserDto) => void
  dimmed?: boolean
  emphasized?: boolean
}

function useAnimatedPosition(user: OnlineUserDto) {
  const [position, setPosition] = useState({ lat: user.latitude, lng: user.longitude })
  const [heading, setHeading] = useState(0)
  const positionRef = useRef(position)
  const headingRef = useRef(heading)
  const lastUpdateRef = useRef(new Date(user.lastUpdated).getTime())
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)

    const from = positionRef.current
    const to = { lat: user.latitude, lng: user.longitude }
    const distance = distanceInMeters(from, to)
    const updateTime = new Date(user.lastUpdated).getTime()
    const elapsedSeconds = Math.max((updateTime - lastUpdateRef.current) / 1_000, 1)
    lastUpdateRef.current = Number.isFinite(updateTime) ? updateTime : Date.now()

    // GPS commonly oscillates a few metres while the device is stationary.
    if (distance < GPS_JITTER_METERS) return

    const nextHeading = nearestHeading(headingRef.current, bearingInDegrees(from, to))
    headingRef.current = nextHeading
    setHeading(nextHeading)

    // Avoid drawing an implausible line across the city after a bad GPS fix.
    // A delayed but valid update remains accepted because its elapsed time
    // increases the permitted distance.
    const maximumDistance = Math.max(
      300,
      elapsedSeconds * MAX_PLAUSIBLE_SPEED_METERS_PER_SECOND,
    )
    if (distance > maximumDistance) {
      positionRef.current = to
      setPosition(to)
      return
    }

    const startedAt = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / MARKER_ANIMATION_MS, 1)
      const easedProgress = smoothStep(progress)
      const next = {
        lat: from.lat + (to.lat - from.lat) * easedProgress,
        lng: from.lng + (to.lng - from.lng) * easedProgress,
      }
      positionRef.current = next
      setPosition(next)
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [user.latitude, user.longitude])

  return { position, heading }
}

function AnimatedUserMarker({
  user,
  onClick,
  dimmed = false,
  emphasized = false,
}: AnimatedUserMarkerProps) {
  const { position, heading } = useAnimatedPosition(user)

  const isStale =
    new Date().getTime() - new Date(user.lastUpdated).getTime() > 30 * 1000
  const markerColor = user.role === 'Driver' ? '#1F4FE0' : '#95C11F'

  return (
    <AdvancedMarker position={position} onClick={() => onClick(user)}>
      <div
        className="relative rounded-full border-2 border-white shadow-lg transition-all hover:scale-110"
        style={{
          opacity: dimmed ? 0.22 : isStale ? 0.6 : 1,
          transform: emphasized ? 'scale(1.16)' : undefined,
          zIndex: emphasized ? 20 : undefined,
        }}
        title={`${user.role === 'Driver' ? 'Motorista' : 'Passageiro'}: ${user.fullName}`}
      >
        <UserAvatar
          photoUrl={user.photoUrl}
          fullName={user.fullName}
          size="md"
          className="ring-2 ring-white"
        />
        <span
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white shadow-sm"
          style={{ backgroundColor: isStale ? '#A2ADC4' : markerColor }}
          aria-hidden="true"
        >
          {user.role === 'Driver' ? (
              <CarFront
                size={14}
                strokeWidth={2.7}
                style={{
                  transform: `rotate(${heading}deg)`,
                  transition: 'transform 450ms ease-out',
                }}
              />
            )
            : <UserRound size={14} strokeWidth={2.7} />}
        </span>
      </div>
    </AdvancedMarker>
  )
}

interface ActiveTravelCarProps {
  travel: TodayTravelDto
  driver: OnlineUserDto
  dimmed: boolean
  emphasized: boolean
  onClick: () => void
}

function ActiveTravelCar({ travel, driver, dimmed, emphasized, onClick }: ActiveTravelCarProps) {
  const { position, heading } = useAnimatedPosition(driver)

  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white shadow-xl transition-all hover:scale-110"
        style={{
          background: 'linear-gradient(145deg, #2F6B45, #123D27)',
          boxShadow: emphasized
            ? '0 0 0 7px rgba(22,101,52,.22), 0 10px 24px rgba(18,61,39,.38)'
            : '0 7px 18px rgba(18,61,39,.32)',
          opacity: dimmed ? .22 : 1,
          transform: emphasized ? 'scale(1.16)' : undefined,
        }}
        title={`Viagem em andamento: ${travel.driverName ?? 'Motorista'} e ${travel.passengerName}`}
      >
        <CarFront
          size={27}
          strokeWidth={2.5}
          style={{
            transform: `rotate(${heading}deg)`,
            transition: 'transform 450ms ease-out',
          }}
        />
      </div>
    </AdvancedMarker>
  )
}

function FinishFlag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M5 3v18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4h12v10H6z" fill="white" />
      <path d="M6 4h4v3H6zm8 0h4v3h-4zm-4 3h4v3h-4zm-4 3h4v4H6zm8 0h4v4h-4z" fill="currentColor" />
    </svg>
  )
}

export default function DashboardMap({ users, travels, activeFilter }: DashboardMapProps) {
  const [focusedTravelId, setFocusedTravelId] = useState<string | null>(null)
  const [lockedTravelId, setLockedTravelId] = useState<string | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'user' | 'travel'
    data: OnlineUserDto | TodayTravelDto
    position: { lat: number; lng: number }
  } | null>(null)

  const showUsers = activeFilter === 'all' || activeFilter === 'drivers' || activeFilter === 'passengers'
  const showTravels = activeFilter === 'travels'
  const activeFocusId = lockedTravelId ?? focusedTravelId
  const activeTravels = travels.filter(
    (travel) => travel.status === 'Accepted' || travel.status === 'InProgress',
  )
  const activeTravelParticipantIds = new Set(
    activeTravels
      .flatMap((travel) => [travel.driverId, travel.passengerId].filter(Boolean) as string[]),
  )

  const visibleUsers = showUsers
    ? activeFilter === 'drivers'
      ? users.filter(
        (user) => user.role === 'Driver' && !activeTravelParticipantIds.has(user.userId),
      )
      : activeFilter === 'passengers'
        ? users.filter(
          (user) => user.role === 'Passenger' && !activeTravelParticipantIds.has(user.userId),
        )
        : users.filter(
          (user) => (user.role === 'Driver' || user.role === 'Passenger')
            && !activeTravelParticipantIds.has(user.userId),
        )
    : []

  const visibleTravels = showTravels ? activeTravels : []

  useEffect(() => {
    if (selectedMarker?.type !== 'travel') return
    const selectedTravel = selectedMarker.data as TodayTravelDto
    if (activeTravels.some((travel) => travel.travelId === selectedTravel.travelId)) return
    setSelectedMarker(null)
    setLockedTravelId(null)
    setFocusedTravelId(null)
  }, [activeTravels, selectedMarker])

  const userForTravel = useCallback((
    travel: TodayTravelDto,
    role: 'Driver' | 'Passenger',
  ): OnlineUserDto | null => {
    const userId = role === 'Driver' ? travel.driverId : travel.passengerId
    if (!userId) return null
    const liveUser = users.find((user) => user.userId === userId)
    if (liveUser) return liveUser

    return {
      userId,
      fullName: role === 'Driver' ? travel.driverName ?? 'Motorista' : travel.passengerName,
      role,
      latitude: role === 'Driver' ? travel.initialLatitude : travel.destinationLatitude,
      longitude: role === 'Driver' ? travel.initialLongitude : travel.destinationLongitude,
      lastUpdated: new Date().toISOString(),
      photoUrl: role === 'Driver' ? travel.driverPhotoUrl : travel.passengerPhotoUrl,
    }
  }, [users])

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

  const selectTravel = useCallback((travel: TodayTravelDto, position: MapPosition) => {
    setLockedTravelId((current) => current === travel.travelId ? null : travel.travelId)
    setSelectedMarker({ type: 'travel', data: travel, position })
  }, [])

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
          disableDefaultUI
          style={{ width: '100%', height: '100%' }}
        >
          <FitBoundsOnData users={visibleUsers} travels={visibleTravels} activeFilter={activeFilter} />

          {/* User markers */}
          {visibleUsers.map((user) => (
            <AnimatedUserMarker
              key={`user-${user.userId}`}
              user={user}
              onClick={handleUserClick}
              dimmed={activeFocusId !== null && !visibleTravels.some(
                (travel) => travel.travelId === activeFocusId
                  && (travel.driverId === user.userId || travel.passengerId === user.userId),
              )}
              emphasized={activeFocusId !== null && visibleTravels.some(
                (travel) => travel.travelId === activeFocusId
                  && (travel.driverId === user.userId || travel.passengerId === user.userId),
              )}
            />
          ))}

          {/* Active travel visualization */}
          {visibleTravels.map((travel) => {
            const driver = userForTravel(travel, 'Driver')
            const passenger = userForTravel(travel, 'Passenger')
            const isFocused = activeFocusId === travel.travelId
            const isDimmed = activeFocusId !== null && !isFocused
            const focus = () => {
              if (!lockedTravelId) setFocusedTravelId(travel.travelId)
            }
            const blur = () => {
              if (!lockedTravelId) setFocusedTravelId(null)
            }
            const infoPosition = driver
              ? { lat: driver.latitude, lng: driver.longitude }
              : { lat: travel.initialLatitude, lng: travel.initialLongitude }

            return (
              <div key={`travel-${travel.travelId}`}>
                {travel.status === 'Accepted' && activeFilter === 'travels' && driver && (
                  <AnimatedUserMarker
                    user={driver}
                    onClick={handleUserClick}
                    dimmed={isDimmed}
                    emphasized={isFocused}
                  />
                )}
                {travel.status === 'Accepted' && activeFilter === 'travels' && passenger && (
                  <AnimatedUserMarker
                    user={passenger}
                    onClick={handleUserClick}
                    dimmed={isDimmed}
                    emphasized={isFocused}
                  />
                )}
                {travel.status === 'InProgress' && driver && (
                  <ActiveTravelCar
                    travel={travel}
                    driver={driver}
                    dimmed={isDimmed}
                    emphasized={isFocused}
                    onClick={() => selectTravel(travel, infoPosition)}
                  />
                )}
                <AdvancedMarker
                  position={{ lat: travel.destinationLatitude, lng: travel.destinationLongitude }}
                  onClick={() => selectTravel(travel, {
                    lat: travel.destinationLatitude,
                    lng: travel.destinationLongitude,
                  })}
                >
                  <div
                    className={`flex items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md transition-opacity ${travel.status === 'InProgress' ? 'h-9 w-9 bg-[#166534]' : 'h-7 w-7 bg-cobalto'}`}
                    style={{ opacity: isDimmed ? .2 : 1 }}
                    title={travel.status === 'Accepted' ? 'Local de embarque' : 'Destino'}
                  >
                    {travel.status === 'Accepted' ? 'E' : <FinishFlag />}
                  </div>
                </AdvancedMarker>
                {travel.encodedPolyline && (
                  <CobaltGoogleRoute
                    encodedPolyline={travel.encodedPolyline}
                    color={travel.status === 'InProgress' ? '#166534' : '#1F4FE0'}
                    highlighted={isFocused}
                    dimmed={isDimmed}
                    onFocus={focus}
                    onBlur={blur}
                    onSelect={() => selectTravel(travel, infoPosition)}
                  />
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
                    ? 'Nenhuma viagem acontecendo no momento'
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
