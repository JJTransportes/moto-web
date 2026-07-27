import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PartitionDetailPage from '../pages/PartitionDetailPage'
import { getPartition } from '../api/publicPartitionApi'

vi.mock('../api/publicPartitionApi', () => ({
  getPartition: vi.fn(),
}))

const mockedGet = vi.mocked(getPartition)

const DETAIL = {
  partitionId: 'pid-1',
  name: 'SMTT',
  identifier: 'SMTT-001',
  acronym: 'SMTT',
  departments: 'Transporte',
  departmentList: [],
  categoryIds: [] as string[],
  categoryTitles: [] as string[],
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

function renderPage(partitionId = 'pid-1', role = 'GlobalAdmin') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles: [role] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/partitions/${partitionId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/partitions/:partitionId" element={<PartitionDetailPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('PartitionDetailPage', () => {
  it('renders all partition fields on success', async () => {
    mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
    renderPage()
    await waitFor(() => expect(screen.getAllByText('SMTT').length).toBeGreaterThan(0))
    expect(screen.getByText('SMTT-001')).toBeInTheDocument()
    expect(screen.getByText('Maceió')).toBeInTheDocument()
    expect(screen.getByText('AL')).toBeInTheDocument()
    expect(screen.getByText('BR')).toBeInTheDocument()
  })

  it('shows "—" when no categories are assigned', async () => {
    mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
    renderPage()
    await waitFor(() => screen.getAllByText('SMTT'))
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows categoryTitles when present', async () => {
    mockedGet.mockResolvedValueOnce({ ok: true, data: { ...DETAIL, categoryTitles: ['Categoria A'] } })
    renderPage()
    await waitFor(() => screen.getByText('Categoria A'))
  })

  it('shows not-found state on 404', async () => {
    mockedGet.mockResolvedValueOnce({ ok: false, status: 404, message: 'Not found' })
    renderPage()
    await waitFor(() => expect(screen.getByText(/não encontrada/i)).toBeInTheDocument())
  })

  it('shows back link to /partitions', async () => {
    mockedGet.mockResolvedValueOnce({ ok: false, status: 404, message: 'Not found' })
    renderPage()
    await waitFor(() => screen.getByText(/não encontrada/i))
    expect(screen.getByRole('link', { name: /Voltar/i })).toHaveAttribute('href', '/partitions')
  })

  it('shows Edit link for GlobalAdmin', async () => {
    mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
    renderPage('pid-1', 'GlobalAdmin')
    await waitFor(() => screen.getAllByText('SMTT'))
    expect(screen.getByRole('link', { name: /Editar/i })).toHaveAttribute('href', '/partitions/pid-1/edit')
  })

  it('shows Edit link for GlobalAdmin', async () => {
    mockedGet.mockResolvedValueOnce({ ok: true, data: DETAIL })
    renderPage('pid-1', 'GlobalAdmin')
    await waitFor(() => screen.getAllByText('SMTT'))
    expect(screen.getByRole('link', { name: /Editar/i })).toHaveAttribute('href', '/partitions/pid-1/edit')
  })
})
