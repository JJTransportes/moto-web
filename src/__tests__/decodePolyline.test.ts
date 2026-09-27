import { describe, expect, it } from 'vitest'
import { decodePolyline } from '../utils/decodePolyline'

describe('decodePolyline', () => {
  it('preserva os pontos da geometria codificada', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ])
  })

  it('rejeita geometria truncada', () => {
    expect(() => decodePolyline('_')).toThrow('Polyline inválida')
  })
})
