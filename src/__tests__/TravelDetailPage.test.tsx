import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import TravelDetailPage from '../pages/TravelDetailPage'
import type { TravelDetailResponse } from '../types/travel'

vi.mock('../api/travelApi', () => ({
  fetchTravelById: vi.fn(),
  cancelTravel: vi.fn(),
}))

import { fetchTravelById, cancelTravel } from '../api/travelApi'

const mockFetchById = fetchTravelById as ReturnType<typeof vi.fn>
const mockCancel = cancelTravel as ReturnType<typeof vi.fn>

function renderPage(travelId: string = 't-123') {
  sessionStorage.setItem('moto_admin_token', 'fake-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: ['GlobalAdmin'] }),
  )

  return render(
    <MemoryRouter initialEntries={[`/routes/${travelId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/routes/:travelId" element={<TravelDetailPage />} />
          <Route path="/routes" element={<div>List Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function makeDetail(overrides: Partial<TravelDetailResponse> = {}): TravelDetailResponse {
  return {
    travelId: 't-123',
    orderId: 'o-1',
    driverId: 'd-1',
    passengerId: 'p-1',
    status: 'InProgress',
    createdAt: '2026-06-20T10:00:00Z',
    startedAt: '2026-06-20T10:05:00Z',
    finishedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    driverName: 'Carlos Oliveira',
    passengerName: 'João Silva',
    routes: [
      {
        routeId: 'r-1',
        sequenceIndex: 0,
        departureAddress: 'Rua A, 100',
        destinationAddress: 'Rua B, 200',
        routeDestinationInMeters: 5200,
        averageTravelTimeInHours: 0,
        averageTravelTimeInMinutes: 15,
        initialLatitude: -23.5,
        initialLongitude: -46.6,
        destinationLatitude: -23.6,
        destinationLongitude: -46.7,
        encodedPolyline: '',
      },
    ],
    ...overrides,
  }
}

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('TravelDetailPage', () => {
  it('renders full travel details with mock data', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail() })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })
    expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument()
    expect(screen.getByText('Em Andamento')).toBeInTheDocument()
    expect(screen.getByText('Rota 1')).toBeInTheDocument()
  })

  it('displays route information', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail() })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Origem:')).toBeInTheDocument()
      expect(screen.getByText('Rua A, 100')).toBeInTheDocument()
      expect(screen.getByText('Destino:')).toBeInTheDocument()
      expect(screen.getByText('Rua B, 200')).toBeInTheDocument()
      expect(screen.getByText('5.2 km')).toBeInTheDocument()
      expect(screen.getByText('15 min')).toBeInTheDocument()
    })
  })

  it('renders map container', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail() })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Mapa')).toBeInTheDocument()
    })
    // Leaflet map container should exist
    const mapContainer = document.querySelector('.leaflet-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('shows Cancel Travel button for non-terminal status', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail({ status: 'Pending' }) })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Cancelar Viagem')).toBeInTheDocument()
    })
  })

  it('shows Cancel Travel button for InProgress', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail({ status: 'InProgress' }) })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Cancelar Viagem')).toBeInTheDocument()
    })
  })

  it('hides Cancel Travel button for Completed', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail({ status: 'Completed' }) })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Concluída')).toBeInTheDocument()
    })
    expect(screen.queryByText('Cancelar Viagem')).not.toBeInTheDocument()
  })

  it('hides Cancel Travel button for Cancelled', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail({ status: 'Cancelled' }) })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Cancelada')).toBeInTheDocument()
    })
    expect(screen.queryByText('Cancelar Viagem')).not.toBeInTheDocument()
  })

  it('opens cancel modal when clicking Cancel Travel', async () => {
    mockFetchById.mockResolvedValue({ ok: true, data: makeDetail({ status: 'Pending' }) })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Cancelar Viagem')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Cancelar Viagem'))

    await waitFor(() => {
      expect(screen.getByText('Confirmar Cancelamento')).toBeInTheDocument()
    })
  })

  it('shows 404 message for not found travel', async () => {
    mockFetchById.mockResolvedValue({ ok: false, status: 404, message: 'Viagem não encontrada.' })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Viagem não encontrada')).toBeInTheDocument()
    })
  })

  it('shows error with retry button', async () => {
    mockFetchById.mockResolvedValue({ ok: false, status: 500, message: 'Erro.' })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Erro.')).toBeInTheDocument()
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
    })
  })
})
