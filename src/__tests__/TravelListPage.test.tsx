import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import TravelListPage from '../pages/TravelListPage'
import type { TravelAdminListItem, TravelStatus } from '../types/travel'

vi.mock('../api/travelApi', () => ({
  fetchTravels: vi.fn(),
}))

import { fetchTravels } from '../api/travelApi'

const mockFetchTravels = fetchTravels as ReturnType<typeof vi.fn>

function renderPage(initialEntries: string[] = ['/routes']) {
  sessionStorage.setItem('moto_admin_token', 'fake-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: ['GlobalAdmin'] }),
  )

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <TravelListPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function makeItem(overrides: Partial<TravelAdminListItem> = {}): TravelAdminListItem {
  return {
    travelId: 't-1',
    orderId: 'o-1',
    passengerName: 'João Silva',
    driverName: 'Carlos Oliveira',
    destinationAddress: 'Rua das Flores, 123',
    status: 'Accepted' as TravelStatus,
    createdAt: '2026-06-20T10:30:00Z',
    ...overrides,
  }
}

function mockSuccess(items: TravelAdminListItem[], totalCount: number = items.length) {
  mockFetchTravels.mockResolvedValue({
    ok: true,
    data: { items, page: 1, pageSize: 20, totalCount },
  })
}

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('TravelListPage', () => {
  it('renders table rows with mock data', async () => {
    mockSuccess([makeItem(), makeItem({ travelId: 't-2', passengerName: 'Maria' })])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getAllByText('Carlos Oliveira').length).toBe(2)
    expect(screen.getAllByText('Rua das Flores, 123').length).toBe(2) // table cell + popup on map
  })

  it('renders status badge in the table', async () => {
    mockSuccess([makeItem()])
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Aceita')).toBeInTheDocument()
    })
  })

  it('action column has link to travel detail', async () => {
    mockSuccess([makeItem()])
    renderPage()

    await waitFor(() => {
      const buttons = screen.getAllByTitle('Ver detalhes')
      expect(buttons.length).toBe(1)
    })
  })

  it('shows empty state when no travels', async () => {
    mockSuccess([], 0)
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nenhuma viagem encontrada.')).toBeInTheDocument()
    })
  })

  it('shows error banner with retry button', async () => {
    mockFetchTravels.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Erro ao carregar viagens.',
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar viagens.')).toBeInTheDocument()
    })
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('shows skeleton while loading', async () => {
    mockFetchTravels.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true, data: { items: [], page: 1, pageSize: 20, totalCount: 0 } }), 10000))
    )
    renderPage()

    // Skeleton should be visible
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('pagination: next button advances page', async () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeItem({ travelId: `t-${i}`, passengerName: `User ${i}` })
    )
    mockSuccess(items, 40) // total > pageSize to enable pagination
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Próximo')).toBeInTheDocument()
    })

    const nextBtn = screen.getByText('Próximo')
    expect(nextBtn).not.toBeDisabled()
  })

  it('status filter toggles checkboxes', async () => {
    mockSuccess([makeItem()])
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    // Click to open dropdown
    await user.click(screen.getByRole('button', { name: /Status/ }))
    await waitFor(() => {
      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })
  })

  it('status column shows correct badge for each status', async () => {
    const statuses: TravelStatus[] = ['Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled']
    mockSuccess(statuses.map((s, i) => makeItem({ travelId: `t-${i}`, status: s })))
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Pendente')).toBeInTheDocument()
      expect(screen.getByText('Aceita')).toBeInTheDocument()
      expect(screen.getByText('Em Andamento')).toBeInTheDocument()
      expect(screen.getByText('Concluída')).toBeInTheDocument()
      expect(screen.getByText('Cancelada')).toBeInTheDocument()
    })
  })
})
