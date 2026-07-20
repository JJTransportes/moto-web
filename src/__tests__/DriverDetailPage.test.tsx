import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import DriverDetailPage from '../pages/DriverDetailPage'
import { fetchDriverProfile, changeDriverVehicle } from '../api/userApi'
import { fetchAvailableVehicles } from '../api/vehicleApi'

vi.mock('../api/userApi', () => ({
  fetchDriverProfile: vi.fn(),
  changeDriverVehicle: vi.fn(),
  fetchUserProfilePhoto: vi.fn().mockResolvedValue({
    ok: true,
    data: { photoUrl: null },
  }),
}))

vi.mock('../api/vehicleApi', () => ({
  fetchAvailableVehicles: vi.fn(),
}))

const mockedFetchProfile = vi.mocked(fetchDriverProfile)
const mockedChangeVehicle = vi.mocked(changeDriverVehicle)
const mockedFetchVehicles = vi.mocked(fetchAvailableVehicles)

const driverData = {
  id: 'driver-1',
  name: 'João Motorista',
  email: 'joao@example.com',
  phone: null,
  cpf: '52998224725',
  cnh: '12345678900',
  vehicle: {
    vehicleId: 'v-001',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    plate: 'ABC-1234',
  },
}

const availableVehicles = [
  {
    vehicleId: 'v-002',
    brand: 'Honda',
    model: 'Civic',
    year: 2023,
    plate: 'DEF-5678',
    categoryId: 'cat-2',
    categoryTitle: 'Categoria B',
  },
]

function renderPage(userId = 'driver-user-1') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/users/drivers/${userId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/users/drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="/users" element={<div>Users Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('DriverDetailPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('shows loading skeleton initially', () => {
    mockedFetchProfile.mockReturnValue(new Promise(() => {}))
    mockedFetchVehicles.mockReturnValue(new Promise(() => {}))
    renderPage()
    const skeletonDivs = document.querySelectorAll('.animate-pulse')
    expect(skeletonDivs.length).toBeGreaterThan(0)
  })

  it('shows driver details when loaded', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: driverData })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: availableVehicles })
    renderPage()

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('João Motorista')
    })
    expect(screen.getByText('joao@example.com')).toBeInTheDocument()
  })

  it('shows current vehicle details', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: driverData })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: availableVehicles })
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('João Motorista')
    })

    const vehicleSection = screen.getByText('Veículo atual').closest('div')!
    expect(within(vehicleSection).getByText('Toyota')).toBeInTheDocument()
    expect(within(vehicleSection).getByText('Corolla')).toBeInTheDocument()
    expect(within(vehicleSection).getByText('2024')).toBeInTheDocument()
    expect(within(vehicleSection).getByText('ABC-1234')).toBeInTheDocument()
  })

  it('shows no vehicle message when driver has no vehicle', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...driverData, vehicle: null },
    })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: availableVehicles })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nenhum veículo associado.')).toBeInTheDocument()
    })
  })

  it('shows not found state when driver does not exist', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: false,
      status: 404,
      message: 'Motorista não encontrado.',
    })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: [] })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Motorista não encontrado')).toBeInTheDocument()
    })
  })

  it('shows error state with retry button on server error', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Erro ao carregar perfil do motorista. Tente novamente.',
    })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: [] })
    renderPage()

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar perfil do motorista. Tente novamente.'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('calls changeDriverVehicle when switching vehicle', async () => {
    // Setup initial load
    mockedFetchProfile.mockResolvedValue({ ok: true, data: driverData })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: availableVehicles })
    mockedChangeVehicle.mockResolvedValue({
      ok: true,
      data: {
        vehicleId: 'v-002',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        plate: 'DEF-5678',
      },
    })

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('João Motorista')
    })

    // Select the new vehicle
    fireEvent.change(screen.getByLabelText('Veículo disponível'), {
      target: { value: 'v-002' },
    })

    await user.click(screen.getByRole('button', { name: 'Alterar veículo' }))

    await waitFor(() => {
      expect(mockedChangeVehicle).toHaveBeenCalledWith('valid-token', 'driver-user-1', 'v-002')
    })
  })

  it('shows error when vehicle switch fails', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: driverData })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: availableVehicles })
    mockedChangeVehicle.mockResolvedValue({
      ok: false,
      status: 409,
      message: 'Este veículo já está associado a outro motorista.',
    })

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('João Motorista')
    })

    fireEvent.change(screen.getByLabelText('Veículo disponível'), {
      target: { value: 'v-002' },
    })

    await user.click(screen.getByRole('button', { name: 'Alterar veículo' }))

    await waitFor(() => {
      expect(
        screen.getByText('Este veículo já está associado a outro motorista.'),
      ).toBeInTheDocument()
    })
  })

  it('shows no available vehicles message when list is empty', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: driverData })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: [] })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nenhum veículo disponível no momento.')).toBeInTheDocument()
    })
  })

  it('navigates back to users list on back button click', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: driverData })
    mockedFetchVehicles.mockResolvedValue({ ok: true, data: availableVehicles })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('João Motorista')
    })

    await user.click(screen.getByText('Voltar'))
    await waitFor(() => {
      expect(screen.getByText('Users Page')).toBeInTheDocument()
    })
  })
})
