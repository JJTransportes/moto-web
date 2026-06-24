import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import DriverCreationPage from '../pages/DriverCreationPage'
import { createDriver } from '../api/userApi'
import { fetchAvailableVehicles } from '../api/vehicleApi'

vi.mock('../api/userApi', () => ({ createDriver: vi.fn() }))
vi.mock('../api/vehicleApi', () => ({ fetchAvailableVehicles: vi.fn() }))

const mockedCreateDriver = vi.mocked(createDriver)
const mockedFetchAvailableVehicles = vi.mocked(fetchAvailableVehicles)

const mockVehicles = [
  {
    vehicleId: 'v-001',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    plate: 'ABC-1234',
    categoryId: 'cat-1',
    categoryTitle: 'Categoria A',
  },
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

function renderPage() {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem('moto_admin_user', JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }))
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DriverCreationPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'João Motorista' } })
  fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '52998224725' } })
  fireEvent.change(screen.getByLabelText('RG'), { target: { value: 'SP9876543' } })
  fireEvent.change(screen.getByLabelText('Matrícula'), { target: { value: 'MOT-001' } })
  fireEvent.change(screen.getByLabelText('CNH'), { target: { value: '12345678900' } })
  fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '1985-03-15' } })
  fireEvent.change(screen.getByLabelText('Endereço'), { target: { value: 'Av. Brasil, 456' } })
  fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Jacareí' } })
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText('Selecione o veículo'), { target: { value: 'v-001' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'joao@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha inicial'), { target: { value: 'Senha@123' } })
}

describe('DriverCreationPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('loads available vehicles on mount', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    renderPage()

    await waitFor(() => {
      expect(mockedFetchAvailableVehicles).toHaveBeenCalledWith('valid-token')
    })
  })

  it('does not render a department field', () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    renderPage()
    expect(screen.queryByLabelText('Departamento')).not.toBeInTheDocument()
  })

  it('does not render a public partition selector', () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    renderPage()
    expect(screen.queryByLabelText('Unidade pública')).not.toBeInTheDocument()
  })

  it('does not open the modal when CNH is missing', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()
    fireEvent.change(screen.getByLabelText('CNH'), { target: { value: '' } })

    await user.click(screen.getByText('Criar Motorista'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('CNH é obrigatório.')).toBeInTheDocument()
  })

  it('does not open the modal when vehicle is not selected', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()
    fireEvent.change(screen.getByLabelText('Selecione o veículo'), { target: { value: '' } })

    await user.click(screen.getByText('Criar Motorista'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows warning when no vehicles are available', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Nenhum veículo disponível/)).toBeInTheDocument()
    })
  })

  it('opens the confirmation modal when all fields are valid', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()

    await user.click(screen.getByText('Criar Motorista'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls createDriver with vehicleId and address', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    mockedCreateDriver.mockResolvedValueOnce({ ok: true, userId: 'new-driver-1' })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()

    await user.click(screen.getByText('Criar Motorista'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'admin-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(mockedCreateDriver).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          address: {
            lineOne: 'Av. Brasil, 456',
            city: 'Jacareí',
            state: 'SP',
            countryCode: 'BR',
          },
          vehicleId: 'v-001',
        }),
      )
    })
  })

  it('shows success state after successful creation', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    mockedCreateDriver.mockResolvedValueOnce({ ok: true, userId: 'new-driver-1' })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()

    await user.click(screen.getByText('Criar Motorista'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'admin-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Motorista criado com sucesso!')).toBeInTheDocument()
    })
  })

  it('keeps the modal open and shows error on 401 response', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    mockedCreateDriver.mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: 'Código do administrador inválido.',
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()

    await user.click(screen.getByText('Criar Motorista'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'wrong-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Código do administrador inválido.')).toBeInTheDocument()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps the modal open and shows error on 409 response', async () => {
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: mockVehicles })
    mockedCreateDriver.mockResolvedValueOnce({
      ok: false,
      status: 409,
      message: 'Dados duplicados. Verifique CPF, e-mail ou CNH.',
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.queryByText('Carregando veículos...')).not.toBeInTheDocument())
    fillValidForm()

    await user.click(screen.getByText('Criar Motorista'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'admin-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Dados duplicados. Verifique CPF, e-mail ou CNH.')).toBeInTheDocument()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
