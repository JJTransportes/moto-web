import { describe, it, expect, afterEach, vi } from 'vitest'
import { fetchProtected } from '../api/authApi'
import {
  fetchAvailableVehicles,
  fetchVehicles,
  fetchVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../api/vehicleApi'

vi.mock('../api/authApi', () => ({
  fetchProtected: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchProtected)

const TOKEN = 'test-token'

const VEHICLE = {
  vehicleId: 'v-1',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2024,
  plate: 'ABC1D23',
  categoryId: 'cat-1',
  categoryTitle: 'Sedan',
  driverId: null,
  driverName: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const AVAILABLE_VEHICLE = {
  vehicleId: 'v-1',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2024,
  plate: 'ABC1D23',
  categoryId: 'cat-1',
  categoryTitle: 'Sedan',
}

describe('vehicleApi', () => {
  afterEach(() => vi.clearAllMocks())

  describe('fetchAvailableVehicles', () => {
    it('returns data on success', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: [AVAILABLE_VEHICLE] })
      const result = await fetchAvailableVehicles(TOKEN)
      expect(result).toEqual({ ok: true, data: [AVAILABLE_VEHICLE] })
    })

    it('returns error on failure', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await fetchAvailableVehicles(TOKEN)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(500)
    })
  })

  describe('fetchVehicles', () => {
    it('returns data on success', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: [VEHICLE] })
      const result = await fetchVehicles(TOKEN)
      expect(result).toEqual({ ok: true, data: [VEHICLE] })
      expect(mockedFetch).toHaveBeenCalledWith('/api/vehicles', TOKEN)
    })

    it('returns error on failure', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await fetchVehicles(TOKEN)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(500)
    })
  })

  describe('fetchVehicle', () => {
    it('returns data on success', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: VEHICLE })
      const result = await fetchVehicle(TOKEN, 'v-1')
      expect(result).toEqual({ ok: true, data: VEHICLE })
      expect(mockedFetch).toHaveBeenCalledWith('/api/vehicles/v-1', TOKEN)
    })

    it('returns 404 message on not found', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      const result = await fetchVehicle(TOKEN, 'v-x')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(404)
        expect(result.message).toBe('Veículo não encontrado.')
      }
    })
  })

  describe('createVehicle', () => {
    const input = {
      brand: 'Honda',
      model: 'Civic',
      year: 2024,
      plate: 'XYZ9A87',
      categoryId: 'cat-2',
    }

    it('calls POST and returns created vehicle', async () => {
      const created = { ...VEHICLE, vehicleId: 'v-new', brand: 'Honda', model: 'Civic' }
      mockedFetch.mockResolvedValueOnce({ ok: true, data: created })
      const result = await createVehicle(TOKEN, input)
      expect(result).toEqual({ ok: true, data: created })
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/vehicles',
        TOKEN,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        }),
      )
    })

    it('returns error on conflict (duplicate plate)', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 409 })
      const result = await createVehicle(TOKEN, input)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(409)
    })
  })

  describe('updateVehicle', () => {
    const input = {
      brand: 'Toyota',
      model: 'Corolla Cross',
      year: 2025,
      plate: 'ABC1D23',
      categoryId: 'cat-1',
    }

    it('calls PUT and returns updated vehicle', async () => {
      const updated = { ...VEHICLE, model: 'Corolla Cross', year: 2025 }
      mockedFetch.mockResolvedValueOnce({ ok: true, data: updated })
      const result = await updateVehicle(TOKEN, 'v-1', input)
      expect(result).toEqual({ ok: true, data: updated })
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/vehicles/v-1',
        TOKEN,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(input),
        }),
      )
    })

    it('returns error on failure', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 400 })
      const result = await updateVehicle(TOKEN, 'v-1', input)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(400)
    })
  })

  describe('deleteVehicle', () => {
    it('returns ok on success (204)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ status: 204, ok: true }))
      const result = await deleteVehicle(TOKEN, 'v-1')
      expect(result).toEqual({ ok: true })
      vi.unstubAllGlobals()
    })

    it('returns ok on success (200)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ status: 200, ok: true }))
      const result = await deleteVehicle(TOKEN, 'v-1')
      expect(result).toEqual({ ok: true })
      vi.unstubAllGlobals()
    })

    it('returns error with message on failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
        status: 409,
        ok: false,
        json: () => Promise.resolve({ error: 'Veículo possui motorista com viagem ativa' }),
      }))
      const result = await deleteVehicle(TOKEN, 'v-1')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(409)
        expect(result.message).toBe('Veículo possui motorista com viagem ativa')
      }
      vi.unstubAllGlobals()
    })

    it('returns connection error on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')))
      const result = await deleteVehicle(TOKEN, 'v-1')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(0)
      vi.unstubAllGlobals()
    })
  })
})
