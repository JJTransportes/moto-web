import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PartitionCreationPage from '../pages/PartitionCreationPage'
import { createPartition } from '../api/publicPartitionApi'
import { listCategories } from '../api/categoryApi'

vi.mock('../api/publicPartitionApi', () => ({
  createPartition: vi.fn(),
}))

vi.mock('../api/categoryApi', () => ({
  listCategories: vi.fn(),
}))

const mockedCreate = vi.mocked(createPartition)
const mockedListCategories = vi.mocked(listCategories)

const CATEGORIES = [
  { categoryId: 'cat-1', title: 'Categoria A', description: null },
  { categoryId: 'cat-2', title: 'Categoria B', description: 'Desc B' },
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
        <PartitionCreationPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'SMTT' } })
  fireEvent.change(screen.getByLabelText('Identificador'), { target: { value: 'SMTT-001' } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'SMTT' } })

  // Add a department
  const deptInput = screen.getByPlaceholderText('Nome da secretaria')
  fireEvent.change(deptInput, { target: { value: 'Transporte' } })
  fireEvent.click(screen.getByText('Adicionar'))

  fireEvent.change(screen.getByLabelText('Logradouro'), { target: { value: 'Rua A, 1' } })
  fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Maceió' } })
  fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'AL' } })
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('PartitionCreationPage', () => {
  it('populates category dropdown when categories load successfully', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Categoria A')).toBeInTheDocument()
      expect(screen.getByText('Categoria B')).toBeInTheDocument()
    })
  })

  it('blocks submission and shows error when category is not selected', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => screen.getByText('Categoria A'))
    fillRequiredFields()
    // Do not select a category
    fireEvent.click(screen.getByText('Criar Unidade'))
    await waitFor(() => expect(screen.getByText(/Categoria é obrigatório/i)).toBeInTheDocument())
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('opens confirmation modal on valid submission', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    renderPage()
    await waitFor(() => screen.getByText('Categoria A'))
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByText('Criar Unidade'))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('calls createPartition with categoryId and adminCode on modal confirm', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    mockedCreate.mockResolvedValueOnce({
      ok: true,
      data: {
        partitionId: 'pid-new',
        name: 'SMTT',
        identifier: 'SMTT-001',
        acronym: 'SMTT',
        departments: 'Transporte',
        departmentList: [],
        categoryId: 'cat-1',
        categoryTitle: 'Categoria A',
        address: {
          addressId: 'addr-1',
          lineOne: 'Rua A, 1',
          lineTwo: null,
          district: null,
          city: 'Maceió',
          state: 'AL',
          postalCode: null,
          countryCode: 'BR',
        },
      },
    })
    renderPage()
    await waitFor(() => screen.getByText('Categoria A'))
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByText('Criar Unidade'))
    await waitFor(() => screen.getByRole('dialog'))

    fireEvent.change(screen.getByLabelText('Código do administrador'), { target: { value: 'my-code' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    const [, input] = mockedCreate.mock.calls[0]
    expect(input.categoryId).toBe('cat-1')
    expect(input.adminCode).toBe('my-code')
  })

  it('shows error banner and disables submit when categories fail to load', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro' })
    renderPage()
    await waitFor(() => expect(screen.getByText(/Não foi possível carregar as categorias/i)).toBeInTheDocument())
    const submitBtn = screen.getByText('Criar Unidade')
    expect(submitBtn).toBeDisabled()
  })

  it('shows error in modal on create failure', async () => {
    mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
    mockedCreate.mockResolvedValueOnce({ ok: false, status: 409, message: 'Erro ao criar unidade. Tente novamente.' })
    renderPage()
    await waitFor(() => screen.getByText('Categoria A'))
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByText('Criar Unidade'))
    await waitFor(() => screen.getByRole('dialog'))

    fireEvent.change(screen.getByLabelText('Código do administrador'), { target: { value: 'my-code' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))

    await waitFor(() => expect(screen.getByText(/Erro ao criar unidade/)).toBeInTheDocument())
  })
})
