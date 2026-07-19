import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PassengerDetailPage from '../pages/PassengerDetailPage'
import { fetchPassengerProfile } from '../api/userApi'

vi.mock('../api/userApi', () => ({
  fetchPassengerProfile: vi.fn(),
  fetchUserProfilePhoto: vi.fn().mockResolvedValue({
    ok: true,
    data: { photoUrl: null },
  }),
}))

const mockedFetchProfile = vi.mocked(fetchPassengerProfile)

const passengerData = {
  passengerId: 'passenger-1',
  fullName: 'Maria Passageira',
  email: 'maria@example.com',
  cpf: '52998224725',
  rg: '12345678',
  registration: 'MAT-001',
  birthdate: '1990-05-15T12:00:00.000Z',
  address: {
    lineOne: 'Rua das Flores, 123',
    lineTwo: 'Apto 45',
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01234-567',
    countryCode: 'BR',
  },
  publicPartitionId: 'part-1',
  publicPartitionName: 'Secretaria de Educação',
  departments: [
    { departmentId: 'dept-1', name: 'TI' },
    { departmentId: 'dept-2', name: 'RH' },
  ],
  isActive: true,
  createdAt: '2025-01-10T08:00:00.000Z',
  solicitationCount: 7,
}

function renderPage(userId = 'passenger-user-1') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/users/passengers/${userId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/users/passengers/:userId" element={<PassengerDetailPage />} />
          <Route path="/users" element={<div>Users Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('PassengerDetailPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('shows loading skeleton initially', () => {
    mockedFetchProfile.mockReturnValue(new Promise(() => {}))
    renderPage()
    const skeletonDivs = document.querySelectorAll('.animate-pulse')
    expect(skeletonDivs.length).toBeGreaterThan(0)
  })

  it('shows passenger details when loaded', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Maria Passageira')
    })
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
    expect(screen.getByText('52998224725')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('MAT-001')).toBeInTheDocument()
  })

  it('shows active status badge when passenger is active', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument()
    })
  })

  it('shows inactive status badge when passenger is inactive', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, isActive: false },
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Inativo')).toBeInTheDocument()
    })
  })

  it('shows department list when passenger has departments', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('TI')).toBeInTheDocument()
      expect(screen.getByText('RH')).toBeInTheDocument()
    })
  })

  it('shows empty departments message when passenger has no departments', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, departments: [] },
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nenhum departamento associado.')).toBeInTheDocument()
    })
  })

  it('shows full address details', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument()
      expect(screen.getByText('Apto 45')).toBeInTheDocument()
      expect(screen.getByText('Centro')).toBeInTheDocument()
      expect(screen.getByText('São Paulo/SP')).toBeInTheDocument()
      expect(screen.getByText('01234-567')).toBeInTheDocument()
      expect(screen.getByText('BR')).toBeInTheDocument()
    })
  })

  it('shows public partition name', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Secretaria de Educação')).toBeInTheDocument()
    })
  })

  it('shows solicitation count', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument()
    })
  })

  it('shows formatted dates', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('15/05/1990')).toBeInTheDocument()
      expect(screen.getByText('10/01/2025')).toBeInTheDocument()
    })
  })

  it('shows not found state when passenger does not exist', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: false,
      status: 404,
      message: 'Passageiro não encontrado.',
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Passageiro não encontrado')).toBeInTheDocument()
    })
    expect(screen.getByText('Voltar para Usuários')).toBeInTheDocument()
  })

  it('shows error state with retry button on server error', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Erro ao carregar dados do passageiro. Tente novamente.',
    })
    renderPage()

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar dados do passageiro. Tente novamente.'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('navigates back to users list on back button click', async () => {
    mockedFetchProfile.mockResolvedValue({ ok: true, data: passengerData })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Maria Passageira')
    })

    await user.click(screen.getByText('Voltar'))
    await waitFor(() => {
      expect(screen.getByText('Users Page')).toBeInTheDocument()
    })
  })

  it('navigates back to users from not found page', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: false,
      status: 404,
      message: 'Passageiro não encontrado.',
    })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Passageiro não encontrado')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Voltar para Usuários'))
    await waitFor(() => {
      expect(screen.getByText('Users Page')).toBeInTheDocument()
    })
  })
})
