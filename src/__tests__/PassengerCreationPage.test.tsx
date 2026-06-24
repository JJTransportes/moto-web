import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PassengerCreationPage from '../pages/PassengerCreationPage'
import { createPassenger } from '../api/userApi'
import { listPartitions } from '../api/publicPartitionApi'

vi.mock('../api/userApi', () => ({ createPassenger: vi.fn() }))
vi.mock('../api/publicPartitionApi', () => ({ listPartitions: vi.fn() }))

const mockedCreatePassenger = vi.mocked(createPassenger)
const mockedListPartitions = vi.mocked(listPartitions)

const STUB_PARTITIONS = [
  { partitionId: 'part-1', name: 'Secretaria de TI', identifier: 'STI', acronym: 'STI', departments: 'TI' },
]

async function renderPage() {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem('moto_admin_user', JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }))
  mockedListPartitions.mockResolvedValue({ ok: true, data: STUB_PARTITIONS })
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <MemoryRouter>
        <AuthProvider>
          <PassengerCreationPage />
        </AuthProvider>
      </MemoryRouter>,
    )
  })
  return result
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Maria Silva' } })
  fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '52998224725' } })
  fireEvent.change(screen.getByLabelText('RG'), { target: { value: 'SP1234567' } })
  fireEvent.change(screen.getByLabelText('Matrícula'), { target: { value: 'REG-001' } })
  fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '1990-05-20' } })
  fireEvent.change(screen.getByLabelText('Endereço'), { target: { value: 'Rua Central, 123' } })
  fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Jacareí' } })
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'TI' } })
  fireEvent.change(screen.getByLabelText('Unidade pública'), { target: { value: 'part-1' } })
  fireEvent.change(screen.getByLabelText('Nível de acesso'), { target: { value: 'User' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'maria@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha inicial'), { target: { value: 'Senha@123' } })
}

describe('PassengerCreationPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('loads public partitions on mount', async () => {
    await renderPage()
    await waitFor(() => expect(mockedListPartitions).toHaveBeenCalledWith('valid-token'))
  })

  it('does not open the modal when partition is not selected', async () => {
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()
    fireEvent.change(screen.getByLabelText('Unidade pública'), { target: { value: '' } })

    await user.click(screen.getByText('Criar Passageiro'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Unidade é obrigatório.')).toBeInTheDocument()
  })

  it('does not open the modal when access level is not selected', async () => {
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()
    fireEvent.change(screen.getByLabelText('Nível de acesso'), { target: { value: '' } })

    await user.click(screen.getByText('Criar Passageiro'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Acesso é obrigatório.')).toBeInTheDocument()
  })

  it('opens the confirmation modal when all fields are valid', async () => {
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()

    await user.click(screen.getByText('Criar Passageiro'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls createPassenger with an inline address object when modal is confirmed', async () => {
    mockedCreatePassenger.mockResolvedValueOnce({ ok: true, userId: 'new-passenger-1' })
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()

    await user.click(screen.getByText('Criar Passageiro'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'admin-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(mockedCreatePassenger).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({
          address: {
            lineOne: 'Rua Central, 123',
            city: 'Jacareí',
            state: 'SP',
            countryCode: 'BR',
          },
          publicPartitionId: 'part-1',
          access: 'User',
        }),
      )
    })
  })

  it('shows success state after successful creation', async () => {
    mockedCreatePassenger.mockResolvedValueOnce({ ok: true, userId: 'new-passenger-1' })
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()

    await user.click(screen.getByText('Criar Passageiro'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'admin-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Passageiro criado com sucesso!')).toBeInTheDocument()
    })
  })

  it('keeps the modal open and shows error on 401 response', async () => {
    mockedCreatePassenger.mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: 'Código do administrador inválido.',
    })
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()

    await user.click(screen.getByText('Criar Passageiro'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'wrong-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Código do administrador inválido.')).toBeInTheDocument()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps the modal open and shows error on 409 response', async () => {
    mockedCreatePassenger.mockResolvedValueOnce({
      ok: false,
      status: 409,
      message: 'Dados duplicados. Verifique CPF, e-mail ou CNH.',
    })
    const user = userEvent.setup()
    await renderPage()
    fillValidForm()

    await user.click(screen.getByText('Criar Passageiro'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'admin-code')
    await user.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('Dados duplicados. Verifique CPF, e-mail ou CNH.')).toBeInTheDocument()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
