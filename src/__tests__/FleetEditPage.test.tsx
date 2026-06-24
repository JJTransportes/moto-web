import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import FleetEditPage from '../pages/FleetEditPage'
import { fetchVehicle, updateVehicle } from '../api/vehicleApi'
import { listCategories } from '../api/categoryApi'

vi.mock('../api/vehicleApi', () => ({
  fetchVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}))

vi.mock('../api/categoryApi', () => ({
  listCategories: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchVehicle)
const mockedUpdate = vi.mocked(updateVehicle)
const mockedListCategories = vi.mocked(listCategories)

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

const CATEGORIES = [
  { categoryId: 'cat-1', title: 'Sedan', description: null },
  { categoryId: 'cat-2', title: 'SUV', description: 'SUVs e crossovers' },
]

function renderPage(vehicleId = 'v-1', role = 'GlobalAdmin') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: [role] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/fleets/${vehicleId}/edit`]}>
      <AuthProvider>
        <Routes>
          <Route path="/fleets/:vehicleId/edit" element={<FleetEditPage />} />
          <Route path="/fleets/:vehicleId" element={<div data-testid="fleet-detail">Fleet Detail</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('FleetEditPage', () => {
  it('renders form pre-filled with vehicle data', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Toyota')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Corolla')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024')).toBeInTheDocument()
      expect(screen.getByDisplayValue('ABC1D23')).toBeInTheDocument()
    })
  })

  it('shows error when vehicle fails to load', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: false, status: 404, message: 'Veículo não encontrado.' })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage('v-x')

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar veículo/)).toBeInTheDocument()
    })
  })

  it('shows validation errors when submitting empty form after clearing', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()

    await waitFor(() => screen.getByDisplayValue('Toyota'))

    // Clear all fields
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Placa'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '' } })

    fireEvent.click(screen.getByText('Salvar Alterações'))

    await waitFor(() => {
      expect(screen.getByText('Marca é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Modelo é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Ano é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Placa é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Categoria é obrigatório.')).toBeInTheDocument()
    })
  })

  it('calls updateVehicle on valid submission and redirects', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    mockedUpdate.mockResolvedValueOnce({
      ok: true,
      data: { ...VEHICLE, model: 'Corolla Cross', year: 2025 },
    })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('Toyota'))

    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Corolla Cross' } })
    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '2025' } })
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })

    fireEvent.click(screen.getByText('Salvar Alterações'))

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith('valid-token', 'v-1', {
        brand: 'Toyota',
        model: 'Corolla Cross',
        year: 2025,
        plate: 'ABC1D23',
        categoryId: 'cat-1',
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('fleet-detail')).toBeInTheDocument()
    })
  })

  it('shows submit error on API failure', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    mockedUpdate.mockResolvedValueOnce({ ok: false, status: 409, message: 'Placa já cadastrada.' })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('Toyota'))
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })

    fireEvent.click(screen.getByText('Salvar Alterações'))

    await waitFor(() => {
      expect(screen.getByText('Placa já cadastrada.')).toBeInTheDocument()
    })
  })

  it('has a "Cancelar" link back to detail page', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()

    await waitFor(() => screen.getByDisplayValue('Toyota'))
    const cancelLink = screen.getByRole('link', { name: 'Cancelar' })
    expect(cancelLink).toHaveAttribute('href', '/fleets/v-1')
  })

  it('has breadcrumb back to detail page', async () => {
    mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()

    await waitFor(() => screen.getByDisplayValue('Toyota'))
    const backLink = screen.getByText('← Voltar para detalhes')
    expect(backLink).toHaveAttribute('href', '/fleets/v-1')
  })
})
