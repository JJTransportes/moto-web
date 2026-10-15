import { useEffect, useMemo } from 'react'
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { decodePolyline } from '../../utils/decodePolyline'

interface CobaltGoogleRouteProps {
  encodedPolyline: string
  color?: string
  highlighted?: boolean
  dimmed?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onSelect?: () => void
}

export default function CobaltGoogleRoute({
  encodedPolyline,
  color = '#1F4FE0',
  highlighted = false,
  dimmed = false,
  onFocus,
  onBlur,
  onSelect,
}: CobaltGoogleRouteProps) {
  const map = useMap()
  const maps = useMapsLibrary('maps')
  const path = useMemo(() => {
    try { return decodePolyline(encodedPolyline) } catch { return [] }
  }, [encodedPolyline])

  useEffect(() => {
    if (!map || !maps || path.length < 2) return
    const opacity = dimmed ? .18 : 1
    const halo = new maps.Polyline({
      map,
      path,
      strokeColor: color,
      strokeOpacity: dimmed ? .08 : highlighted ? .42 : .2,
      strokeWeight: highlighted ? 16 : 11,
      zIndex: highlighted ? 5 : 1,
      geodesic: true,
      clickable: true,
    })
    const core = new maps.Polyline({
      map,
      path,
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: highlighted ? 7 : 5,
      zIndex: highlighted ? 6 : 2,
      geodesic: true,
      clickable: true,
    })
    const listeners = [
      core.addListener('mouseover', onFocus ?? (() => undefined)),
      core.addListener('mouseout', onBlur ?? (() => undefined)),
      core.addListener('click', onSelect ?? (() => undefined)),
      halo.addListener('mouseover', onFocus ?? (() => undefined)),
      halo.addListener('mouseout', onBlur ?? (() => undefined)),
      halo.addListener('click', onSelect ?? (() => undefined)),
    ]
    return () => {
      listeners.forEach((listener) => listener.remove())
      halo.setMap(null)
      core.setMap(null)
    }
  }, [color, dimmed, highlighted, map, maps, onBlur, onFocus, onSelect, path])

  return null
}
