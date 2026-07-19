import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import UsersPage from '../pages/UsersPage'

// Mock the API modules
vi.mock('../api/userListApi', () => ({
  listDrivers: vi.fn(),
  listPassengers: vi.fn(),
}))

vi.mock('../api/userApi', () => ({
  fetchUserProfilePhoto: vi.fn().mockResolvedValue({
    ok: true,
    data: { photoUrl: null },
  }),
}))

import { listDrivers, listPassengers } from '../api/userListApi'

function renderUsersPage(initialEntries: string[] = ['/users']) {
  sessionStorage.setItem('moto_admin_token', 'fake-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: ['GlobalAdmin'] }),
  )

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <UsersPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

const mockDriversResponse = {
  items: [
    {
      driverId: 'd1',
      userId: 'u1',
      fullName: 'João Motorista',
      email: 'joao@test.com',
      cpf: '111.111.111-11',
      rg: '11.111.111-1',
      birthdate: '1980-01-01',
      department: 'Transportes',
      cnh: '12345678901',
      access: 'User',
      city: 'Jacareí',
      state: 'SP',
      createdAt: '2025-01-01T00:00:00Z',
      isActive: true,
      categoryTitle: 'Veículos de Transporte',
      travelCount: 10,
    },
    {
      driverId: 'd2',
      userId: 'u2',
      fullName: 'Maria Motorista',
      email: 'maria@test.com',
      cpf: '222.222.222-22',
      rg: '22.222.222-2',
      birthdate: '1985-05-05',
      department: null,
      cnh: '98765432109',
      access: 'User',
      city: 'Jacareí',
      state: 'SP',
      createdAt: '2025-02-01T00:00:00Z',
      isActive: false,
      categoryTitle: null,
      travelCount: 0,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 2,
}

const mockPassengersResponse = {
  items: [
    {
      passengerId: 'p1',
      userId: 'u3',
      fullName: 'Pedro Passageiro',
      email: 'pedro@test.com',
      cpf: '333.333.333-33',
      rg: '33.333.333-3',
      birthdate: '1990-03-03',
      department: 'Saúde',
      publicPartitionId: 'pp1',
      publicPartitionName: 'Secretaria de Saúde',
      access: 'User',
      city: 'Jacareí',
      state: 'SP',
      createdAt: '2025-03-01T00:00:00Z',
      isActive: true,
      solicitationCount: 5,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 1,
}

describe('UsersPage — rendering', () => {
  it('renders the page title', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Usuários')).toBeInTheDocument()
    })
  })

  it('renders role selector with Motoristas default', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Motoristas')).toBeInTheDocument()
      expect(screen.getByText('Passageiros')).toBeInTheDocument()
    })
  })

  it('shows driver columns when Motoristas is selected', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Categoria')).toBeInTheDocument()
      expect(screen.getByText('Total de Viagens')).toBeInTheDocument()
    })
  })

  it('renders driver data in the table', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('João Motorista')).toBeInTheDocument()
      expect(screen.getByText('Veículos de Transporte')).toBeInTheDocument()
    })
  })

  it('shows status badge Ativo for active users', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument()
      expect(screen.getByText('Inativo')).toBeInTheDocument()
    })
  })

  it('shows "Selecionar" button in each row', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      const buttons = screen.getAllByText('Selecionar')
      expect(buttons.length).toBe(2)
    })
  })

  it('shows empty state when no results', async () => {
    vi.mocked(listDrivers).mockResolvedValue({
      ok: true,
      data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
    })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    vi.mocked(listDrivers).mockResolvedValue({
      ok: false,
      status: 500,
      message: 'Erro ao carregar motoristas. Tente novamente.',
    })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar motoristas. Tente novamente.')).toBeInTheDocument()
    })
  })
})

describe('UsersPage — role switching', () => {
  it('switches to passengers and renders passenger columns', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    vi.mocked(listPassengers).mockResolvedValue({ ok: true, data: mockPassengersResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('João Motorista')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('Passageiros'))

    await waitFor(() => {
      expect(screen.getByText('Unidade Pública')).toBeInTheDocument()
      expect(screen.getByText('Total de Solicitações')).toBeInTheDocument()
      expect(screen.getByText('Pedro Passageiro')).toBeInTheDocument()
      expect(screen.getByText('Secretaria de Saúde')).toBeInTheDocument()
    })
  })
})

describe('UsersPage — search', () => {
  it('renders search input with placeholder', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Buscar por nome, e-mail, CPF ou RG...')
      expect(input).toBeInTheDocument()
    })
  })
})

describe('UsersPage — pagination', () => {
  it('does not show pagination when totalCount <= pageSize', async () => {
    vi.mocked(listDrivers).mockResolvedValue({ ok: true, data: mockDriversResponse })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
    })
  })

  it('shows pagination when totalCount > pageSize', async () => {
    vi.mocked(listDrivers).mockResolvedValue({
      ok: true,
      data: { ...mockDriversResponse, totalCount: 50 },
    })
    renderUsersPage()

    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument()
      expect(screen.getByText('Próximo')).toBeInTheDocument()
    })
  })
})
