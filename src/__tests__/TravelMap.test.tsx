import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TravelMap from '../components/travel/TravelMap'

describe('TravelMap', () => {
  it('renders map container with specified height', () => {
    const { container } = render(
      <TravelMap
        originLat={-23.5}
        originLng={-46.6}
        originLabel="Origem"
        destLat={-23.6}
        destLng={-46.7}
        destLabel="Destino"
        height="300px"
      />,
    )

    const mapDiv = container.querySelector('div')
    expect(mapDiv).toBeInTheDocument()
    expect(mapDiv?.style.height).toBe('300px')
  })

  it('renders without crashing with required props', () => {
    const { container } = render(
      <TravelMap
        originLat={-23.5}
        originLng={-46.6}
        originLabel="Origem"
        destLat={-23.6}
        destLng={-46.7}
        destLabel="Destino"
      />,
    )

    const mapContainer = container.querySelector('div')
    expect(mapContainer).toBeInTheDocument()
  })

  it('uses default height of 400px when not specified', () => {
    const { container } = render(
      <TravelMap
        originLat={0}
        originLng={0}
        originLabel="A"
        destLat={1}
        destLng={1}
        destLabel="B"
      />,
    )

    const mapDiv = container.querySelector('div')
    expect(mapDiv?.style.height).toBe('400px')
  })
})
