import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import DriverEditPage from '../pages/DriverEditPage'
import {
  fetchDriverProfile,
  updateDriver,
  changeDriverVehicle,
  unassignDriverVehicle,
  type DriverProfile,
} from '../api/userApi'
import { fetchAvailableVehicles } from '../api/vehicleApi'

// WEB-08: DriverEditPage não tinha nenhum teste — exatamente onde os 3 bugs
// relatados pelo usuário viviam (WEB-01/02/03/04/05). Este arquivo cobre o
// comportamento corrigido: validação reativa (WEB-02), fluxo de
// vincular/desvincular veículo com "Salvar" bloqueado até confirmar
// (WEB-01/WEB-05) e confirmação de admin na troca de veículo (WEB-04).

vi.mock('../api/userApi', () => ({
  fetchDriverProfile: vi.fn(),
  updateDriver: vi.fn(),
  changeDriverVehicle: vi.fn(),
  unassignDriverVehicle: vi.fn(),
}))

vi.mock('../api/vehicleApi', () => ({
  fetchAvailableVehicles: vi.fn(),
}))

const mockedFetchDriver = vi.mocked(fetchDriverProfile)
const mockedUpdateDriver = vi.mocked(updateDriver)
const mockedChangeVehicle = vi.mocked(changeDriverVehicle)
const mockedUnassignVehicle = vi.mocked(unassignDriverVehicle)
const mockedFetchAvailableVehicles = vi.mocked(fetchAvailableVehicles)

const COMPLETE_DRIVER: DriverProfile = {
  id: 'driver-1',
  name: 'João Motorista',
  email: 'joao@example.com',
  phone: '11999998888',
  cpf: '98765432100',
  cnh: '12345678901',
  vehicle: null,
  rg: 'SP9876543',
  registration: 'MOT-001',
  address: { lineOne: 'Rua das Flores, 123', city: 'Jacareí', state: 'SP', countryCode: 'BR' },
  birthdate: '1985-03-15T00:00:00.000Z',
}

const AVAILABLE_VEHICLES = [
  { vehicleId: 'v-1', brand: 'Honda', model: 'CG 160', year: 2023, plate: 'ABC1234', categoryId: 'cat-1', categoryTitle: 'CAT I' },
]

function renderPage(driverId = 'driver-1') {
  sessionStorage.setItem('moto_admin_token', 'valid-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'admin-1', roles: ['GlobalAdmin'] }),
  )
  return render(
    <MemoryRouter initialEntries={[`/users/drivers/${driverId}/edit`]}>
      <AuthProvider>
        <Routes>
          <Route path="/users/drivers/:driverId/edit" element={<DriverEditPage />} />
          <Route path="/users/drivers/:driverId" element={<div data-testid="driver-detail">Driver Detail</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('DriverEditPage', () => {
  it('renders form pre-filled with driver data', async () => {
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: AVAILABLE_VEHICLES })
    renderPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('João Motorista')).toBeInTheDocument()
      expect(screen.getByDisplayValue('MOT-001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Jacareí')).toBeInTheDocument()
    })
  })

  it('shows error when driver fails to load', async () => {
    mockedFetchDriver.mockResolvedValueOnce({ ok: false, status: 404, message: 'Motorista não encontrado.' })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar motorista/)).toBeInTheDocument()
    })
  })

  it('WEB-02: shows the legacy-record banner listing missing fields, without requiring a submit attempt', async () => {
    mockedFetchDriver.mockResolvedValueOnce({
      ok: true,
      data: { ...COMPLETE_DRIVER, cnh: null, registration: null },
    })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/cadastro é antigo/)).toBeInTheDocument()
      expect(screen.getByText('Matrícula, CNH')).toBeInTheDocument()
    })
    // O botão deve indicar o problema sem que o usuário precise clicar em nada.
    expect(screen.getByText('Salvar Alterações')).toBeDisabled()
  })

  it('WEB-01: disables "Salvar Alterações" once a vehicle is selected but not yet linked', async () => {
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: AVAILABLE_VEHICLES })
    renderPage()

    await waitFor(() => screen.getByDisplayValue('João Motorista'))
    expect(screen.getByText('Salvar Alterações')).not.toBeDisabled()

    fireEvent.change(screen.getByLabelText('Veículo disponível'), { target: { value: 'v-1' } })

    await waitFor(() => {
      expect(screen.getByText('Salvar Alterações')).toBeDisabled()
      expect(screen.getByText(/ainda não foi vinculado/)).toBeInTheDocument()
    })
  })

  it('WEB-01/WEB-04: linking a vehicle requires admin confirmation and re-enables Salvar afterward', async () => {
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: AVAILABLE_VEHICLES })
    mockedChangeVehicle.mockResolvedValueOnce({
      ok: true,
      data: { vehicleId: 'v-1', brand: 'Honda', model: 'CG 160', year: 2023, plate: 'ABC1234' },
    })
    mockedFetchDriver.mockResolvedValueOnce({
      ok: true,
      data: { ...COMPLETE_DRIVER, vehicle: { vehicleId: 'v-1', brand: 'Honda', model: 'CG 160', year: 2023, plate: 'ABC1234' } },
    })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('João Motorista'))

    fireEvent.change(screen.getByLabelText('Veículo disponível'), { target: { value: 'v-1' } })
    fireEvent.click(screen.getByText('Vincular veículo'))

    // Confirmação de admin exigida antes de qualquer chamada de API (WEB-04).
    expect(mockedChangeVehicle).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => expect(mockedChangeVehicle).toHaveBeenCalledWith('valid-token', 'driver-1', 'v-1'))
    await waitFor(() => expect(screen.getByText(/Veículo vinculado/)).toBeInTheDocument())
    expect(screen.getByText('Salvar Alterações')).not.toBeDisabled()
  })

  it('WEB-05: shows "Desvincular" for a driver that already has a vehicle, and confirms before calling the API', async () => {
    const driverWithVehicle: DriverProfile = {
      ...COMPLETE_DRIVER,
      vehicle: { vehicleId: 'v-1', brand: 'Honda', model: 'CG 160', year: 2023, plate: 'ABC1234' },
    }
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: driverWithVehicle })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    mockedUnassignVehicle.mockResolvedValueOnce({
      ok: true,
      data: { vehicleId: 'v-1', brand: 'Honda', model: 'CG 160', year: 2023, plate: 'ABC1234' },
    })
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: AVAILABLE_VEHICLES })

    renderPage()
    await waitFor(() => screen.getByText(/Veículo vinculado/))

    fireEvent.click(screen.getByText('Desvincular'))
    const dialog = await screen.findByRole('dialog')
    expect(screen.getByText(/Confirmar desvínculo de veículo/)).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => expect(mockedUnassignVehicle).toHaveBeenCalledWith('valid-token', 'v-1'))
  })

  it('WEB-05: shows the specific "active travel" error instead of a generic message', async () => {
    const driverWithVehicle: DriverProfile = {
      ...COMPLETE_DRIVER,
      vehicle: { vehicleId: 'v-1', brand: 'Honda', model: 'CG 160', year: 2023, plate: 'ABC1234' },
    }
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: driverWithVehicle })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    mockedUnassignVehicle.mockResolvedValueOnce({
      ok: false,
      status: 409,
      message: 'Não é possível desvincular: o motorista está com uma viagem em andamento.',
    })

    renderPage()
    await waitFor(() => screen.getByText(/Veículo vinculado/))

    fireEvent.click(screen.getByText('Desvincular'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText(/viagem em andamento/)).toBeInTheDocument()
    })
  })

  it('submits personal data via the admin confirmation modal and redirects on success', async () => {
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    mockedUpdateDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('João Motorista'))

    fireEvent.click(screen.getByText('Salvar Alterações'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => {
      expect(mockedUpdateDriver).toHaveBeenCalledWith('valid-token', 'driver-1', expect.objectContaining({
        fullName: 'João Motorista',
        address: expect.objectContaining({ city: 'Jacareí', state: 'SP' }),
        adminCode: 'admin-pass',
      }))
    })
    await waitFor(() => expect(screen.getByTestId('driver-detail')).toBeInTheDocument())
  })

  it('shows submit error on API failure without navigating away', async () => {
    mockedFetchDriver.mockResolvedValueOnce({ ok: true, data: COMPLETE_DRIVER })
    mockedFetchAvailableVehicles.mockResolvedValueOnce({ ok: true, data: [] })
    mockedUpdateDriver.mockResolvedValueOnce({ ok: false, status: 409, message: 'CPF ou CNH já cadastrados para outro usuário.' })

    renderPage()
    await waitFor(() => screen.getByDisplayValue('João Motorista'))

    fireEvent.click(screen.getByText('Salvar Alterações'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Código do administrador'), { target: { value: 'admin-pass' } })
    fireEvent.click(within(dialog).getByText('Confirmar'))

    await waitFor(() => {
      expect(screen.getByText('CPF ou CNH já cadastrados para outro usuário.')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('driver-detail')).not.toBeInTheDocument()
  })
})
