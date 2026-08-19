import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PartitionEditPage from '../pages/PartitionEditPage'
import { getPartition, updatePartition, deletePartition } from '../api/publicPartitionApi'
import { listCategories } from '../api/categoryApi'

vi.mock('../api/publicPartitionApi', () => ({
  getPartition: vi.fn(),
  updatePartition: vi.fn(),
  deletePartition: vi.fn(),
}))

vi.mock('../api/categoryApi', () => ({
  listCategories: vi.fn(),
}))

const mockedGet = vi.mocked(getPartition)
const mockedUpdate = vi.mocked(updatePartition)
const mockedDelete = vi.mocked(deletePartition)
const mockedListCategories = vi.mocked(listCategories)

const DETAIL = {
  partitionId: 'pid-1',
  name: 'SMTT',
  identifier: 'SMTT-001',
  acronym: 'SMTT',
  departments: 'Transporte',
  departmentList: [],
  categoryIds: ['cat-current'],
  categoryTitles: ['Categoria Atual'],
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
}

const CATEGORIES = [
  { categoryId: 'cat-current', title: 'Categoria Atual', description: null },
  { categoryId: 'cat-1', title: 'Categoria A', description: null },
  { categoryId: 'cat-2', title: 'Categoria B', description: 'Desc B' },
]

function renderPage(roles: string[] = ['GlobalAdmin']) {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles }),
  )
  return render(
    <MemoryRouter initialEntries={['/partitions/pid-1/edit']}>
      <AuthProvider>
        <Routes>
          <Route path="/partitions/:partitionId/edit" element={<PartitionEditPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('PartitionEditPage', () => {
  describe('GlobalAdmin', () => {
    it('shows current category name and category checkboxes', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage()
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      expect(screen.getByText(/Categorias atuais:/)).toBeInTheDocument()
      expect(screen.getAllByText('Categoria Atual').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Alterar categorias')).toBeInTheDocument()
    })

    it('opens confirmation modal on save click', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage()
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      fireEvent.click(screen.getByText('Salvar Alterações'))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
      expect(mockedUpdate).not.toHaveBeenCalled()
    })

    it('sends categoryIds and adminCode on modal confirm with reassignment', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      mockedUpdate.mockResolvedValueOnce({ ok: true, data: { ...DETAIL, categoryIds: ['cat-2'], categoryTitles: ['Categoria B'] } })
      renderPage()
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      // Uncheck current, check 'cat-2' — toggling checkboxes
      const checkboxes = screen.getAllByRole('checkbox')
      // First checkbox is 'cat-current' (checked by default) — uncheck it
      fireEvent.click(checkboxes[0])
      // Second checkbox is 'cat-1' — skip. Third checkbox is 'cat-2' — check it
      fireEvent.click(checkboxes[2])
      fireEvent.click(screen.getByText('Salvar Alterações'))
      await waitFor(() => screen.getByRole('dialog'))

      fireEvent.change(screen.getByLabelText('Código do administrador'), { target: { value: 'my-code' } })
      fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))

      await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1))
      expect(mockedUpdate).toHaveBeenCalledWith('valid-token', 'pid-1', expect.objectContaining({
        categoryIds: ['cat-2'],
        adminCode: 'my-code',
      }))
    })

    it('shows delete button', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage()
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      expect(screen.getByText('Excluir')).toBeInTheDocument()
    })
  })

  describe('non-GlobalAdmin', () => {
    it('does not show category checkboxes', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage(['Admin'])
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      expect(screen.queryByText('Alterar categorias')).toBeNull()
    })

    it('shows current categories as read-only label', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage(['Admin'])
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      expect(screen.getByText(/Categorias:/)).toBeInTheDocument()
      expect(screen.getAllByText('Categoria Atual').length).toBeGreaterThanOrEqual(1)
    })

    it('does not show delete button', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage(['Admin'])
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      expect(screen.queryByText('Excluir')).toBeNull()
    })
  })

  describe('shared behavior', () => {
    it('pre-populates form with partition data on mount', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      renderPage(['GlobalAdmin'])
      await waitFor(() => screen.getByLabelText('Nome*'))
      expect((screen.getByLabelText('Nome*') as HTMLInputElement).value).toBe('SMTT')
      expect((screen.getByLabelText('Logradouro*') as HTMLInputElement).value).toBe('Rua A, 1')
      expect((screen.getByLabelText('Cidade*') as HTMLInputElement).value).toBe('Maceió')
    })

    it('shows error message on load failure', async () => {
      mockedGet.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro' })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: [] })
      renderPage(['GlobalAdmin'])
      await waitFor(() => expect(screen.getByText(/Erro ao carregar/i)).toBeInTheDocument())
    })

    it('shows error in save modal on update failure', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      mockedUpdate.mockResolvedValueOnce({ ok: false, status: 409, message: 'Erro ao atualizar unidade. Tente novamente.' })
      renderPage()
      await waitFor(() => screen.getByText('Editar Unidade Pública'))
      fireEvent.click(screen.getByText('Salvar Alterações'))
      await waitFor(() => screen.getByRole('dialog'))

      fireEvent.change(screen.getByLabelText('Código do administrador'), { target: { value: 'my-code' } })
      fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))

      await waitFor(() => expect(screen.getAllByText(/Erro ao atualizar/).length).toBeGreaterThan(0))
    })

    it('calls deletePartition after delete modal confirmation (GlobalAdmin)', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      mockedDelete.mockResolvedValueOnce({ ok: true })
      renderPage()
      await waitFor(() => screen.getByText('Excluir'))
      fireEvent.click(screen.getByText('Excluir'))
      await waitFor(() => screen.getByRole('dialog'))
      fireEvent.change(screen.getByLabelText('Código do administrador'), { target: { value: 'my-code' } })
      fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))
      await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('valid-token', 'pid-1'))
    })

    it('shows delete error in modal', async () => {
      mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
      mockedListCategories.mockResolvedValueOnce({ ok: true, data: CATEGORIES })
      mockedDelete.mockResolvedValueOnce({ ok: false, status: 409, message: 'Erro ao excluir unidade. Tente novamente.' })
      renderPage()
      await waitFor(() => screen.getByText('Excluir'))
      fireEvent.click(screen.getByText('Excluir'))
      await waitFor(() => screen.getByRole('dialog'))
      fireEvent.change(screen.getByLabelText('Código do administrador'), { target: { value: 'my-code' } })
      fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))
      await waitFor(() => expect(screen.getByText(/Erro ao excluir/)).toBeInTheDocument())
    })
  })
})
