import { useEffect, useMemo, useState } from 'react'
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'

interface TravelMapProps {
  originLat: number
  originLng: number
  originLabel: string
  destLat: number
  destLng: number
  destLabel: string
  height?: string
  route?: Array<[number, number]>
}

type MapPoint = { lat: number; lng: number }

function FitTravelBounds({ points }: { points: MapPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || points.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    points.forEach((point) => bounds.extend(point))
    map.fitBounds(bounds, 64)
  }, [map, points])

  return null
}

function TravelRoute({ path }: { path: MapPoint[] }) {
  const map = useMap()
  const maps = useMapsLibrary('maps')

  useEffect(() => {
    if (!map || !maps || path.length < 2) return

    const halo = new maps.Polyline({
      map,
      path,
      strokeColor: '#9dbbff',
      strokeOpacity: 0.48,
      strokeWeight: 12,
      geodesic: true,
      zIndex: 1,
    })
    const routeLine = new maps.Polyline({
      map,
      path,
      strokeColor: '#1f4fe0',
      strokeOpacity: 1,
      strokeWeight: 5,
      geodesic: true,
      zIndex: 2,
    })

    return () => {
      halo.setMap(null)
      routeLine.setMap(null)
    }
  }, [map, maps, path])

  return null
}

function PointMarker({
  position,
  label,
  color,
}: {
  position: MapPoint
  label: string
  color: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AdvancedMarker position={position} title={label} onClick={() => setOpen(true)}>
        <div
          className="h-6 w-6 rounded-full border-[3px] border-white shadow-md"
          style={{ backgroundColor: color }}
        />
      </AdvancedMarker>
      {open && (
        <InfoWindow position={position} onCloseClick={() => setOpen(false)}>
          <p className="max-w-64 text-sm text-slate-700">{label}</p>
        </InfoWindow>
      )}
    </>
  )
}

export default function TravelMap({
  originLat, originLng, originLabel,
  destLat, destLng, destLabel,
  height = '400px', route,
}: TravelMapProps) {
  const apiKey = import.meta.env.VITE_MAPS_API_KEY ?? ''
  const origin = useMemo(() => ({ lat: originLat, lng: originLng }), [originLat, originLng])
  const destination = useMemo(() => ({ lat: destLat, lng: destLng }), [destLat, destLng])
  const routePath = useMemo(
    () => route?.map(([lat, lng]) => ({ lat, lng })) ?? [],
    [route],
  )
  const boundsPoints = useMemo(
    () => routePath.length > 1 ? routePath : [origin, destination],
    [destination, origin, routePath],
  )

  return (
    <div
      data-testid="travel-google-map"
      style={{ height }}
      className="w-full overflow-hidden rounded-[26px] border border-[var(--border-default)] shadow-moto"
    >
      {!apiKey || apiKey === 'your_google_maps_api_key_here' ? (
        <div className="flex h-full items-center justify-center bg-slate-50 text-center">
          <div>
            <p className="font-medium text-slate-600">Google Maps API key não configurada</p>
            <p className="mt-1 text-sm text-slate-400">Configure VITE_MAPS_API_KEY no arquivo .env</p>
          </div>
        </div>
      ) : (
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={origin}
            defaultZoom={14}
            minZoom={5}
            maxZoom={20}
            restriction={{
              latLngBounds: { north: 6, south: -34, west: -74, east: -34 },
              strictBounds: true,
            }}
            mapId="moto-travel-detail-map"
            gestureHandling="greedy"
            scrollwheel
            disableDefaultUI
            zoomControl
            style={{ width: '100%', height: '100%' }}
          >
            <FitTravelBounds points={boundsPoints} />
            <TravelRoute path={routePath} />
            <PointMarker position={origin} label={originLabel} color="#95c11f" />
            <PointMarker position={destination} label={destLabel} color="#1f4fe0" />
          </Map>
        </APIProvider>
      )}
    </div>
  )
}
