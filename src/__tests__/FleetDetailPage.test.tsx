import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import FleetDetailPage from '../pages/FleetDetailPage'
import { fetchVehicle, deleteVehicle } from '../api/vehicleApi'

vi.mock('../api/vehicleApi', () => ({
  fetchVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchVehicle)
const mockedDelete = vi.mocked(deleteVehicle)

const VEHICLE = {
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
  updatedAt: '2025-01-15T00:00:00Z',
}

const VEHICLE_WITH_DRIVER = {
  ...VEHICLE,
  driverId: 'driver-1',
  driverName: 'João Motorista',
}

function renderPage(vehicleId = 'v-1', role = 'GlobalAdmin') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: [role] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/fleets/${vehicleId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/fleets/:vehicleId" element={<FleetDetailPage />} />
          <Route path="/fleets" element={<div data-testid="fleets-list">Fleets List</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('FleetDetailPage', () => {
  it('renders vehicle details on success', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => expect(screen.getByText('Toyota Corolla')).toBeInTheDocument())
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('ABC1D23')).toBeInTheDocument()
    expect(screen.getByText('Sedan')).toBeInTheDocument()
  })

  it('shows "Disponível" badge when no driver', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => expect(screen.getByText('Disponível')).toBeInTheDocument())
  })

  it('shows "Em uso" badge when driver assigned', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE_WITH_DRIVER })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Em uso')).toBeInTheDocument()
      expect(screen.getByText('João Motorista')).toBeInTheDocument()
    })
  })

  it('shows "Nenhum motorista associado" when no driver', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Nenhum motorista associado.')).toBeInTheDocument()
    })
  })

  it('shows not-found message for 404', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: false, status: 404, message: 'Veículo não encontrado.' })
    renderPage('v-x')
    await waitFor(() => expect(screen.getByText('Veículo não encontrado.')).toBeInTheDocument())
  })

  it('shows error state on API failure', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro' })
    renderPage()
    await waitFor(() => expect(screen.getByText(/Erro ao carregar veículo/)).toBeInTheDocument())
  })

  it('has "Editar" button that links to edit page', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => screen.getByText('Toyota Corolla'))
    const editLink = screen.getByRole('link', { name: /Editar/ })
    expect(editLink).toHaveAttribute('href', '/fleets/v-1/edit')
  })

  it('opens delete confirmation modal', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => screen.getByText('Toyota Corolla'))

    fireEvent.click(screen.getByText('Excluir'))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Excluir veículo')).toBeInTheDocument()
    })
  })

  it('closes delete modal on cancel', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => screen.getByText('Toyota Corolla'))

    fireEvent.click(screen.getByText('Excluir'))
    await waitFor(() => screen.getByRole('dialog'))

    // Click cancel in the modal
    const cancelButtons = screen.getAllByText('Cancelar')
    const modalCancel = cancelButtons.find(b => b.closest('[role="dialog"]'))
    fireEvent.click(modalCancel!)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('calls deleteVehicle on confirm and redirects to list', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedDelete.mockResolvedValueOnce({ ok: true })

    renderPage()
    await waitFor(() => screen.getByText('Toyota Corolla'))

    fireEvent.click(screen.getByText('Excluir'))
    await waitFor(() => screen.getByRole('dialog'))

    // Fill admin code and confirm
    const adminInput = screen.getByPlaceholderText('Digite sua senha')
    fireEvent.change(adminInput, { target: { value: 'admin123' } })

    const confirmButton = screen.getByText('Confirmar')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith('valid-token', 'v-1')
    })

    await waitFor(() => {
      expect(screen.getByTestId('fleets-list')).toBeInTheDocument()
    })
  })

  it('shows error when delete fails', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedDelete.mockResolvedValueOnce({ ok: false, status: 409, message: 'Veículo possui motorista com viagem ativa' })

    renderPage()
    await waitFor(() => screen.getByText('Toyota Corolla'))

    fireEvent.click(screen.getByText('Excluir'))
    await waitFor(() => screen.getByRole('dialog'))

    const adminInput = screen.getByPlaceholderText('Digite sua senha')
    fireEvent.change(adminInput, { target: { value: 'admin123' } })

    fireEvent.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Veículo possui motorista com viagem ativa')).toBeInTheDocument()
    })
  })

  it('has breadcrumb back to fleets', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    renderPage()
    await waitFor(() => screen.getByText('Toyota Corolla'))
    const backLink = screen.getByText('← Frotas')
    expect(backLink).toHaveAttribute('href', '/fleets')
  })
})
