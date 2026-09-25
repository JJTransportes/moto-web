import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PassengerDetailPage from '../pages/PassengerDetailPage'
import { fetchPassengerProfile, setPriorityAccess } from '../api/userApi'

vi.mock('../api/userApi', () => ({
  fetchPassengerProfile: vi.fn(),
  fetchUserProfilePhoto: vi.fn().mockResolvedValue({
    ok: true,
    data: { photoUrl: null },
  }),
  setPriorityAccess: vi.fn(),
}))

const mockedFetchProfile = vi.mocked(fetchPassengerProfile)
const mockedSetPriorityAccess = vi.mocked(setPriorityAccess)

const passengerData = {
  passengerId: 'passenger-1',
  userId: 'passenger-user-1',
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
  priorityTravelsEnabled: false,
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
          <Route path="/users/passengers/:passengerId" element={<PassengerDetailPage />} />
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
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument()
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
      const inactiveBadges = screen.getAllByText('Inativo')
      expect(inactiveBadges.some((el) => el.className.includes('bg-red-100'))).toBe(true)
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
      // "São Paulo/SP" aparece 2x de propósito agora: no card-resumo do topo
      // (lido de address.city/state, fonte única desde a correção de WEB-03)
      // e na seção "Endereço" mais abaixo.
      expect(screen.getAllByText('São Paulo/SP').length).toBeGreaterThan(0)
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

  it('shows priority access as inactive when disabled', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, priorityTravelsEnabled: false },
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Pedidos prioritários')).toBeInTheDocument()
    })
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('shows priority access as active when enabled', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, priorityTravelsEnabled: true },
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
  })

  it('enables priority access when toggled on', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, priorityTravelsEnabled: false },
    })
    mockedSetPriorityAccess.mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    await user.click(screen.getByRole('switch'))

    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
    expect(mockedSetPriorityAccess).toHaveBeenCalledWith('valid-token', 'passenger-user-1', true)
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
  })

  it('disables priority access when toggled off', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, priorityTravelsEnabled: true },
    })
    mockedSetPriorityAccess.mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    await user.click(screen.getByRole('switch'))

    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })
    expect(mockedSetPriorityAccess).toHaveBeenCalledWith('valid-token', 'passenger-user-1', false)
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('shows an error message when priority toggle fails and keeps previous state', async () => {
    mockedFetchProfile.mockResolvedValue({
      ok: true,
      data: { ...passengerData, priorityTravelsEnabled: false },
    })
    mockedSetPriorityAccess.mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Erro ao alterar acesso a pedidos prioritários. Tente novamente.',
    })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    await user.click(screen.getByRole('switch'))

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao alterar acesso a pedidos prioritários. Tente novamente.'),
      ).toBeInTheDocument()
    })
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })
})
