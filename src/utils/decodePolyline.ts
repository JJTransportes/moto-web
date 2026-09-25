export type RoutePoint = { lat: number; lng: number }

/** Decodifica uma polyline Google sem calcular ou alterar sua geometria. */
export function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = []
  let index = 0
  let latitude = 0
  let longitude = 0

  while (index < encoded.length) {
    const [latitudeDelta, nextLatitudeIndex] = decodeValue(encoded, index)
    index = nextLatitudeIndex
    const [longitudeDelta, nextLongitudeIndex] = decodeValue(encoded, index)
    index = nextLongitudeIndex
    latitude += latitudeDelta
    longitude += longitudeDelta
    points.push({ lat: latitude / 1e5, lng: longitude / 1e5 })
  }

  return points
}

function decodeValue(encoded: string, start: number): [number, number] {
  let result = 0
  let shift = 0
  let index = start
  let byte: number

  do {
    if (index >= encoded.length) throw new Error('Polyline inválida')
    byte = encoded.charCodeAt(index++) - 63
    result |= (byte & 0x1f) << shift
    shift += 5
  } while (byte >= 0x20)

  return [(result & 1) !== 0 ? ~(result >> 1) : result >> 1, index]
}
