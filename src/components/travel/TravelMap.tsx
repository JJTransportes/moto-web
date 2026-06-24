import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useMemo } from 'react'

// Fix Leaflet default icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

interface TravelMapProps {
  originLat: number
  originLng: number
  originLabel: string
  destLat: number
  destLng: number
  destLabel: string
  height?: string
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
  height = '400px',
}: TravelMapProps) {
  const bounds = useMemo(() => {
    return L.latLngBounds(
      [originLat, originLng],
      [destLat, destLng],
    )
  }, [originLat, originLng, destLat, destLng])

  const originIcon = useMemo(() => createIcon('#22c55e'), [])
  const destIcon = useMemo(() => createIcon('#ef4444'), [])

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-gray-200">
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
