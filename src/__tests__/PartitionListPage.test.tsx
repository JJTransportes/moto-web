import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PartitionListPage from '../pages/PartitionListPage'
import { listPartitions } from '../api/publicPartitionApi'

vi.mock('../api/publicPartitionApi', () => ({
  listPartitions: vi.fn(),
}))

const mockedList = vi.mocked(listPartitions)

function renderPage(role = 'GlobalAdmin') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: [role] }),
  )
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PartitionListPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('PartitionListPage', () => {
  it('renders partition rows on success', async () => {
    mockedList.mockResolvedValueOnce({
      ok: true,
      data: [
        { partitionId: 'pid-1', name: 'SMTT', identifier: 'SMTT-001', acronym: 'SMTT', departments: 'Transporte', categoryIds: ['cat-1'], categoryTitles: ['Transporte'] },
        { partitionId: 'pid-2', name: 'SEMED', identifier: 'SEMED-001', acronym: 'SEMED', departments: 'Educação', categoryIds: ['cat-2'], categoryTitles: ['Educação'] },
      ],
    })
    renderPage()
    await waitFor(() => expect(screen.getByText('SMTT')).toBeInTheDocument())
    expect(screen.getByText('SEMED')).toBeInTheDocument()
  })

  it('each row links to the correct detail path', async () => {
    mockedList.mockResolvedValueOnce({
      ok: true,
      data: [
        { partitionId: 'pid-1', name: 'SMTT', identifier: 'SMTT-001', acronym: 'SMTT', departments: 'Transporte', categoryIds: ['cat-1'], categoryTitles: ['Transporte'] },
      ],
    })
    renderPage()
    await waitFor(() => screen.getByText('SMTT'))
    const link = screen.getByRole('link', { name: /SMTT/ })
    expect(link).toHaveAttribute('href', '/partitions/pid-1')
  })

  it('shows empty state when list is empty', async () => {
    mockedList.mockResolvedValueOnce({ ok: true, data: [] })
    renderPage()
    await waitFor(() => expect(screen.getByText(/Nenhuma unidade cadastrada/)).toBeInTheDocument())
  })

  it('shows error banner when API call fails', async () => {
    mockedList.mockResolvedValueOnce({ ok: false, status: 500, message: 'Erro' })
    renderPage()
    await waitFor(() => expect(screen.getByText(/Erro ao carregar/)).toBeInTheDocument())
  })

  it('shows "Nova Unidade" link for GlobalAdmin', async () => {
    mockedList.mockResolvedValueOnce({ ok: true, data: [] })
    renderPage('GlobalAdmin')
    await waitFor(() => expect(screen.getByRole('link', { name: /Nova Unidade/ })).toBeInTheDocument())
  })

  it('hides "Nova Unidade" link for Admin (not GlobalAdmin)', async () => {
    mockedList.mockResolvedValueOnce({ ok: true, data: [] })
    renderPage('Admin')
    await waitFor(() => screen.getByText(/Nenhuma unidade/))
    expect(screen.queryByRole('link', { name: /Nova Unidade/ })).not.toBeInTheDocument()
  })
})
