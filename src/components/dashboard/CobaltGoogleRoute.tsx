import { useEffect, useMemo } from 'react'
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { decodePolyline } from '../../utils/decodePolyline'

interface CobaltGoogleRouteProps {
  encodedPolyline: string
}

export default function CobaltGoogleRoute({ encodedPolyline }: CobaltGoogleRouteProps) {
  const map = useMap()
  const maps = useMapsLibrary('maps')
  const path = useMemo(() => {
    try { return decodePolyline(encodedPolyline) } catch { return [] }
  }, [encodedPolyline])

  useEffect(() => {
    if (!map || !maps || path.length < 2) return
    const halo = new maps.Polyline({ map, path, strokeColor: '#9DBBFF', strokeOpacity: .48, strokeWeight: 12, zIndex: 1, geodesic: true })
    const core = new maps.Polyline({ map, path, strokeColor: '#1F4FE0', strokeOpacity: 1, strokeWeight: 5, zIndex: 2, geodesic: true })
    return () => { halo.setMap(null); core.setMap(null) }
  }, [map, maps, path])

  return null
}
