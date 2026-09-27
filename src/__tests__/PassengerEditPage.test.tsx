import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PassengerEditPage from '../pages/PassengerEditPage'
import { fetchPassengerProfile, updatePassenger, type PassengerProfile } from '../api/userApi'
import { fetchPartitionDepartments } from '../api/publicPartitionApi'

// WEB-08: PassengerEditPage não tinha nenhum teste — par de DriverEditPage,
// mesmo foco: validação reativa em cadastros legados incompletos (WEB-02)
// sem exigir uma tentativa de submit primeiro.

vi.mock('../api/userApi', () => ({
  fetchPassengerProfile: vi.fn(),
  updatePassenger: vi.fn(),
}))

vi.mock('../api/publicPartitionApi', () => ({
  fetchPartitionDepartments: vi.fn(),
}))

const mockedFetchPassenger = vi.mocked(fetchPassengerProfile)
const mockedUpdatePassenger = vi.mocked(updatePassenger)
const mockedFetchDepartments = vi.mocked(fetchPartitionDepartments)

const COMPLETE_PASSENGER: PassengerProfile = {
  passengerId: 'passenger-1',
  userId: 'user-1',
  fullName: 'Maria Passageira',
  email: 'maria@example.com',
  cpf: '12345678909',
  rg: 'MG1234567',
  registration: 'REG-001',
  birthdate: '1990-05-20T00:00:00.000Z',
  address: { lineOne: 'Rua das Flores, 123', city: 'Jacareí', state: 'SP', countryCode: 'BR' },
  publicPartitionId: 'part-1',
  publicPartitionName: 'Secretaria de Educação',
  departments: [],
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  solicitationCount: 0,
  priorityTravelsEnabled: false,
}

const DEPARTMENTS = [{ departmentId: 'dept-1', name: 'TI' }]

function renderPage(passengerId = 'passenger-1') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/users/passengers/${passengerId}/edit`]}>
      <AuthProvider>
        <Routes>
          <Route path="/users/passengers/:passengerId/edit" element={<PassengerEditPage />} />
          <Route path="/users/passengers/:passengerId" element={<div data-testid="passenger-detail">Passenger Detail</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('PassengerEditPage', () => {
  it('renders form pre-filled with passenger data', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({ ok: true, data: COMPLETE_PASSENGER })
    mockedFetchDepartments.mockResolvedValueOnce({ ok: true, data: DEPARTMENTS })
    renderPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Maria Passageira')).toBeInTheDocument()
      expect(screen.getByDisplayValue('REG-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Jacareí')).toBeInTheDocument()
    })
  })

  it('shows error when passenger fails to load', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({ ok: false, status: 404, message: 'Passageiro não encontrado.' })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar passageiro/)).toBeInTheDocument()
    })
  })

  it('WEB-02: shows the legacy-record banner listing missing fields, without requiring a submit attempt', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({
      ok: true,
      data: { ...COMPLETE_PASSENGER, rg: '', registration: '' },
    })
    mockedFetchDepartments.mockResolvedValueOnce({ ok: true, data: DEPARTMENTS })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/cadastro é antigo/)).toBeInTheDocument()
      expect(screen.getByText('RG, Matrícula')).toBeInTheDocument()
    })
    expect(screen.getByText('Salvar Alterações')).toBeDisabled()
  })

  it('shows department fetch error without blocking the rest of the form', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({ ok: true, data: COMPLETE_PASSENGER })
    mockedFetchDepartments.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro ao carregar departamentos.' })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar departamentos.')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Maria Passageira')).toBeInTheDocument()
    })
  })

  it('submits personal data via the admin confirmation modal and redirects on success', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({ ok: true, data: COMPLETE_PASSENGER })
    mockedFetchDepartments.mockResolvedValueOnce({ ok: true, data: DEPARTMENTS })
    mockedUpdatePassenger.mockResolvedValueOnce({ ok: true, data: COMPLETE_PASSENGER })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('Maria Passageira'))

    fireEvent.click(screen.getByText('Salvar Alterações'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => {
      expect(mockedUpdatePassenger).toHaveBeenCalledWith('valid-token', 'passenger-1', expect.objectContaining({
        fullName: 'Maria Passageira',
        address: expect.objectContaining({ city: 'Jacareí', state: 'SP' }),
        adminCode: 'admin-pass',
      }))
    })
    await waitFor(() => expect(screen.getByTestId('passenger-detail')).toBeInTheDocument())
  })

  it('shows submit error on API failure without navigating away', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({ ok: true, data: COMPLETE_PASSENGER })
    mockedFetchDepartments.mockResolvedValueOnce({ ok: true, data: DEPARTMENTS })
    mockedUpdatePassenger.mockResolvedValueOnce({ ok: false, status: 409, message: 'CPF já cadastrado para outro usuário.' })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('Maria Passageira'))

    fireEvent.click(screen.getByText('Salvar Alterações'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('CPF já cadastrado para outro usuário.')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('passenger-detail')).not.toBeInTheDocument()
  })

  it('has a "Cancelar" link back to detail page', async () => {
    mockedFetchPassenger.mockResolvedValueOnce({ ok: true, data: COMPLETE_PASSENGER })
    mockedFetchDepartments.mockResolvedValueOnce({ ok: true, data: DEPARTMENTS })
    renderPage()

    await waitFor(() => screen.getByDisplayValue('Maria Passageira'))
    const cancelLink = screen.getByRole('link', { name: 'Cancelar' })
    expect(cancelLink).toHaveAttribute('href', '/users/passengers/passenger-1')
  })
})
