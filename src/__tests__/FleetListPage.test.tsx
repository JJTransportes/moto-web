import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import FleetListPage from '../pages/FleetListPage'
import { fetchVehicles } from '../api/vehicleApi'

vi.mock('../api/vehicleApi', () => ({
  fetchVehicles: vi.fn(),
  fetchAvailableVehicles: vi.fn(),
}))

const mockedFetchVehicles = vi.mocked(fetchVehicles)

const VEHICLES = [
  {
    vehicleId: 'v-1',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    plate: 'ABC1D23',
    categoryId: 'cat-1',
    categoryTitle: 'Sedan',
    driverId: null,
    driverName: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    vehicleId: 'v-2',
    brand: 'Honda',
    model: 'Civic',
    year: 2023,
    plate: 'XYZ9A87',
    categoryId: 'cat-2',
    categoryTitle: 'SUV',
    driverId: 'driver-1',
    driverName: 'João Motorista',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
]

function paginated(items: typeof VEHICLES, page = 1, pageSize = 20) {
  return { items, page, pageSize, totalCount: items.length }
}

function renderPage(role = 'GlobalAdmin') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: [role] }),
  )
  return render(
    <MemoryRouter>
      <AuthProvider>
        <FleetListPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('FleetListPage', () => {
  it('renders fleet table on success', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => expect(screen.getByText('Toyota')).toBeInTheDocument())
    expect(screen.getByText('Corolla')).toBeInTheDocument()
    expect(screen.getByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('Civic')).toBeInTheDocument()
  })

  it('requests the first page with the default page size', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))
    expect(mockedFetchVehicles).toHaveBeenCalledWith('valid-token', 1, 20, undefined)
  })

  it('shows "Disponível" badge for vehicles without driver', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => expect(screen.getByText('Disponível')).toBeInTheDocument())
  })

  it('shows "Em uso" badge for vehicles with driver', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => expect(screen.getByText('Em uso')).toBeInTheDocument())
  })

  it('shows driver name when assigned', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => expect(screen.getByText('João Motorista')).toBeInTheDocument())
  })

  it('shows "—" for empty driver', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => {
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  it('each row links to the correct detail path', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))
    // Find the eye icon links - they should point to fleet detail
    // Default sort is brand ascending, so Honda (v-2) comes before Toyota (v-1)
    const links = screen.getAllByTitle('Ver detalhes')
    expect(links[0].closest('a')).toHaveAttribute('href', '/fleets/v-2')
    expect(links[1].closest('a')).toHaveAttribute('href', '/fleets/v-1')
  })

  it('shows empty state when no vehicles', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated([]) })
    renderPage()
    await waitFor(() => expect(screen.getByText(/Nenhum veículo cadastrado/)).toBeInTheDocument())
  })

  it('shows "Cadastrar primeiro veículo" link in empty state for GlobalAdmin', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated([]) })
    renderPage('GlobalAdmin')
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Cadastrar primeiro veículo/ })).toBeInTheDocument()
    })
  })

  it('shows "Novo Veículo" button for GlobalAdmin', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage('GlobalAdmin')
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Novo Veículo/ })).toBeInTheDocument()
    })
  })

  it('shows error banner when API fails', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro' })
    renderPage()
    await waitFor(() => expect(screen.getByText('Erro')).toBeInTheDocument())
  })

  // WEB-06: busca agora é feita no servidor (debounce de 300ms), não mais
  // filtrando em memória — cada teste de busca mocka a 2ª chamada
  // (disparada pelo debounce) com o resultado já filtrado, como o backend
  // devolveria.
  it('searches by brand (server-side, debounced)', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))

    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated([VEHICLES[1]]) })
    const searchInput = screen.getByPlaceholderText(/Buscar por marca, modelo ou placa/)
    fireEvent.change(searchInput, { target: { value: 'Honda' } })

    await waitFor(
      () => {
        expect(screen.getByText('Honda')).toBeInTheDocument()
        expect(screen.queryByText('Toyota')).not.toBeInTheDocument()
      },
      { timeout: 1000 },
    )
    expect(mockedFetchVehicles).toHaveBeenLastCalledWith('valid-token', 1, 20, 'Honda')
  })

  it('searches by model (server-side, debounced)', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))

    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated([VEHICLES[1]]) })
    const searchInput = screen.getByPlaceholderText(/Buscar por marca, modelo ou placa/)
    fireEvent.change(searchInput, { target: { value: 'Civic' } })

    await waitFor(
      () => {
        expect(screen.getByText('Civic')).toBeInTheDocument()
        expect(screen.queryByText('Corolla')).not.toBeInTheDocument()
      },
      { timeout: 1000 },
    )
  })

  it('shows "no results" when search matches nothing', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))

    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated([]) })
    const searchInput = screen.getByPlaceholderText(/Buscar por marca, modelo ou placa/)
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(
      () => {
        expect(screen.getByText(/Nenhum veículo encontrado/)).toBeInTheDocument()
      },
      { timeout: 1000 },
    )
  })

  it('supports sorting the current page by clicking column headers', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({ ok: true, data: paginated(VEHICLES) })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))

    // Click on Marca header to sort descending
    const brandHeader = screen.getByText('Marca')
    fireEvent.click(brandHeader)
    fireEvent.click(brandHeader) // second click = desc

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeInTheDocument()
      expect(screen.getByText('Honda')).toBeInTheDocument()
    })
  })

  it('shows pagination controls and requests the next page', async () => {
    mockedFetchVehicles.mockResolvedValueOnce({
      ok: true,
      data: { items: VEHICLES, page: 1, pageSize: 20, totalCount: 25 },
    })
    renderPage()
    await waitFor(() => screen.getByText('Toyota'))

    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument()

    mockedFetchVehicles.mockResolvedValueOnce({
      ok: true,
      data: { items: [], page: 2, pageSize: 20, totalCount: 25 },
    })
    fireEvent.click(screen.getByRole('button', { name: /Próximo/ }))

    await waitFor(() => {
      expect(mockedFetchVehicles).toHaveBeenLastCalledWith('valid-token', 2, 20, undefined)
    })
  })
})
