import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PassengerCreationPage from '../pages/PassengerCreationPage'
import { createPassenger } from '../api/userApi'
import { listPartitions, fetchPartitionDepartments } from '../api/publicPartitionApi'

vi.mock('../api/userApi', () => ({ createPassenger: vi.fn() }))
vi.mock('../api/publicPartitionApi', () => ({
  listPartitions: vi.fn(),
  fetchPartitionDepartments: vi.fn(),
}))

const mockedCreatePassenger = vi.mocked(createPassenger)
const mockedListPartitions = vi.mocked(listPartitions)
const mockedFetchPartitionDepartments = vi.mocked(fetchPartitionDepartments)

const STUB_PARTITIONS = [
  { partitionId: 'part-1', name: 'Secretaria de TI', identifier: 'STI', acronym: 'STI', departments: 'TI', categoryId: 'cat-1', categoryTitle: 'TI' },
]

const STUB_DEPARTMENTS = [
  { departmentId: 'dept-1', name: 'TI' },
  { departmentId: 'dept-2', name: 'Recursos Humanos' },
]

async function renderPage() {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem('moto_admin_user', JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }))
  mockedListPartitions.mockResolvedValue({ ok: true, data: STUB_PARTITIONS })
  mockedFetchPartitionDepartments.mockResolvedValue({ ok: true, data: STUB_DEPARTMENTS })
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

async function selectUnitAndDepartment(user: ReturnType<typeof userEvent.setup>) {
  // Select the public partition first
  const unitSelect = screen.getByLabelText('Unidade pública')
  await user.selectOptions(unitSelect, 'part-1')

  // Wait for departments to load
  await waitFor(() => {
    expect(screen.getByLabelText('Departamento')).not.toBeDisabled()
  })

  // Select a department
  const deptSelect = screen.getByLabelText('Departamento')
  await user.selectOptions(deptSelect, 'dept-1')
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome completo'), 'Maria Silva')
  await user.type(screen.getByLabelText('CPF'), '52998224725')
  await user.type(screen.getByLabelText('RG'), 'SP1234567')
  await user.type(screen.getByLabelText('Matrícula'), 'REG-001')
  const birthdate = screen.getByLabelText('Data de nascimento')
  await user.clear(birthdate)
  await user.type(birthdate, '1990-05-20')
  await user.type(screen.getByLabelText('Endereço'), 'Rua Central, 123')
  await user.type(screen.getByLabelText('Cidade'), 'Jacareí')
  await user.type(screen.getByLabelText('Estado'), 'SP')

  await selectUnitAndDepartment(user)

  await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
  await user.type(screen.getByLabelText('Senha inicial'), 'Senha@123')
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

  it('fetches departments when a partition is selected', async () => {
    const user = userEvent.setup()
    await renderPage()

    const unitSelect = screen.getByLabelText('Unidade pública')
    await user.selectOptions(unitSelect, 'part-1')

    await waitFor(() => {
      expect(mockedFetchPartitionDepartments).toHaveBeenCalledWith('valid-token', 'part-1')
    })
  })

  it('keeps department disabled when no partition is selected', async () => {
    await renderPage()
    const deptSelect = screen.getByLabelText('Departamento')
    expect(deptSelect).toBeDisabled()
  })

  it('opens the confirmation modal when all fields are valid', async () => {
    const user = userEvent.setup()
    await renderPage()
    await fillValidForm(user)

    await user.click(screen.getByText('Criar Passageiro'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls createPassenger with correct departmentId when modal is confirmed', async () => {
    mockedCreatePassenger.mockResolvedValueOnce({ ok: true, userId: 'new-passenger-1' })
    const user = userEvent.setup()
    await renderPage()
    await fillValidForm(user)

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
          department: 'dept-1',
        }),
      )
    })
  })

  it('shows success state after successful creation', async () => {
    mockedCreatePassenger.mockResolvedValueOnce({ ok: true, userId: 'new-passenger-1' })
    const user = userEvent.setup()
    await renderPage()
    await fillValidForm(user)

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
    await fillValidForm(user)

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
    await fillValidForm(user)

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
