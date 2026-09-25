import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useMemo } from 'react'

// Fix Leaflet default icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

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

function createIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:24px;height:24px;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

export default function TravelMap({
  originLat, originLng, originLabel,
  destLat, destLng, destLabel,
  height = '400px', route,
}: TravelMapProps) {
  const bounds = useMemo(() => {
    return L.latLngBounds(
      [originLat, originLng],
      [destLat, destLng],
    )
  }, [originLat, originLng, destLat, destLng])

  const originIcon = useMemo(() => createIcon('#95c11f'), [])
  const destIcon = useMemo(() => createIcon('#1f4fe0'), [])

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-[26px] border border-[var(--border-default)] shadow-moto">
      <MapContainer
        bounds={bounds}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {route && route.length > 1 && (
          <>
            <Polyline positions={route} pathOptions={{ color: '#9dbbff', opacity: 0.48, weight: 12 }} />
            <Polyline positions={route} pathOptions={{ color: '#1f4fe0', opacity: 1, weight: 5 }} />
          </>
        )}
        <Marker position={[originLat, originLng]} icon={originIcon}>
          <Popup>{originLabel}</Popup>
        </Marker>
        <Marker position={[destLat, destLng]} icon={destIcon}>
          <Popup>{destLabel}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
