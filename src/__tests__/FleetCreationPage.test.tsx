import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import FleetCreationPage from '../pages/FleetCreationPage'
import { createVehicle } from '../api/vehicleApi'
import { listCategories } from '../api/categoryApi'

vi.mock('../api/vehicleApi', () => ({
  createVehicle: vi.fn(),
}))

vi.mock('../api/categoryApi', () => ({
  listCategories: vi.fn(),
}))

const mockedCreate = vi.mocked(createVehicle)
const mockedListCategories = vi.mocked(listCategories)

const CATEGORIES = [
  { categoryId: 'cat-1', title: 'Sedan', description: null },
  { categoryId: 'cat-2', title: 'SUV', description: 'SUVs e crossovers' },
]

function renderPage() {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: ['GlobalAdmin'] }),
  )
  return render(
    <MemoryRouter>
      <AuthProvider>
        <FleetCreationPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'Toyota' } })
  fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Corolla' } })
  fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '2024' } })
  fireEvent.change(screen.getByLabelText('Placa'), { target: { value: 'ABC1D23' } })
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('FleetCreationPage', () => {
  it('populates category dropdown when categories load', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Sedan')).toBeInTheDocument()
      expect(screen.getByText('SUV')).toBeInTheDocument()
    })
  })

  it('shows error when categories fail to load', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro' })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Não foi possível carregar as categorias/)).toBeInTheDocument()
    })
  })

  it('shows validation errors when submitting empty form', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => screen.getByText('Sedan'))

    fireEvent.click(screen.getByText('Cadastrar Veículo'))

    await waitFor(() => {
      expect(screen.getByText('Marca é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Modelo é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Ano é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Placa é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Categoria é obrigatório.')).toBeInTheDocument()
    })
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid year', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => screen.getByText('Sedan'))
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '1800' } })
    fireEvent.click(screen.getByText('Cadastrar Veículo'))

    await waitFor(() => {
      expect(screen.getByText('Ano inválido.')).toBeInTheDocument()
    })
  })

  it('calls createVehicle on valid submission', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    mockedCreate.mockResolvedValueOnce({
      ok: true,
      data: {
        vehicleId: 'v-new',
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
    })

    renderPage()
    await waitFor(() => screen.getByText('Sedan'))
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByText('Cadastrar Veículo'))

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith('valid-token', {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        plate: 'ABC1D23',
        categoryId: 'cat-1',
      })
    })
  })

  it('shows submit error on API failure', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    mockedCreate.mockResolvedValueOnce({ ok: false, status: 409, message: 'Placa já cadastrada.' })

    renderPage()
    await waitFor(() => screen.getByText('Sedan'))
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByText('Cadastrar Veículo'))

    await waitFor(() => {
      expect(screen.getByText('Placa já cadastrada.')).toBeInTheDocument()
    })
  })

  it('has a "Cancelar" link back to fleets list', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => screen.getByText('Sedan'))
    const cancelLink = screen.getByRole('link', { name: 'Cancelar' })
    expect(cancelLink).toHaveAttribute('href', '/fleets')
  })

  it('has breadcrumb back to fleets', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => screen.getByText('Sedan'))
    const backLink = screen.getByText('← Frotas')
    expect(backLink).toHaveAttribute('href', '/fleets')
  })
})
