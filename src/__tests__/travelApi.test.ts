import { describe, it, expect, afterEach, vi } from 'vitest'
import { fetchTravels, fetchTravelById, cancelTravel } from '../api/travelApi'

// Mock the authApi module
vi.mock('../api/authApi', () => ({
  fetchProtected: vi.fn(),
}))

import { fetchProtected } from '../api/authApi'

const mockFetchProtected = fetchProtected as ReturnType<typeof vi.fn>

afterEach(() => {
  vi.clearAllMocks()
})

describe('travelApi', () => {
  describe('fetchTravels', () => {
    it('returns paginated data on success', async () => {
      mockFetchProtected.mockResolvedValue({
        ok: true,
        data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      })

      const result = await fetchTravels('fake-token', { page: 1, pageSize: 20 })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.totalCount).toBe(0)
      }
    })

    it('returns error on failure', async () => {
      mockFetchProtected.mockResolvedValue({ ok: false, status: 500 })

      const result = await fetchTravels('fake-token')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(500)
      }
    })

    it('builds query string with filters', async () => {
      mockFetchProtected.mockResolvedValue({
        ok: true,
        data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      })

      await fetchTravels('fake-token', {
        page: 2,
        pageSize: 10,
        status: ['Completed', 'Cancelled'],
        createdFrom: '2026-01-01',
        createdTo: '2026-06-01',
      })

      expect(mockFetchProtected).toHaveBeenCalledWith(
        expect.stringContaining('?'),
        'fake-token',
      )

      const url = mockFetchProtected.mock.calls[0][0] as string
      expect(url).toContain('page=2')
      expect(url).toContain('pageSize=10')
      expect(url).toContain('status=Completed')
      expect(url).toContain('status=Cancelled')
      expect(url).toContain('createdFrom=2026-01-01')
      expect(url).toContain('createdTo=2026-06-01')
    })
  })

  describe('fetchTravelById', () => {
    it('returns detail on success', async () => {
      const mockDetail = {
        travelId: 't-1',
        orderId: 'o-1',
        driverId: 'd-1',
        passengerId: 'p-1',
        status: 'Pending' as const,
        createdAt: '2026-01-01',
        startedAt: null,
        finishedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        driverName: 'Carlos',
        passengerName: 'João',
        routes: [],
      }

      mockFetchProtected.mockResolvedValue({ ok: true, data: mockDetail })

      const result = await fetchTravelById('fake-token', 't-1')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.travelId).toBe('t-1')
      }
    })

    it('returns 404 message when not found', async () => {
      mockFetchProtected.mockResolvedValue({ ok: false, status: 404 })

      const result = await fetchTravelById('fake-token', 't-999')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(404)
        expect(result.message).toBe('Viagem não encontrada.')
      }
    })
  })

  describe('cancelTravel', () => {
    it('sends reason and returns updated data on success', async () => {
      const mockDetail = {
        travelId: 't-1',
        orderId: 'o-1',
        driverId: 'd-1',
        passengerId: 'p-1',
        status: 'Cancelled' as const,
        createdAt: '2026-01-01',
        startedAt: null,
        finishedAt: null,
        cancelledAt: '2026-01-01',
        cancellationReason: 'Motivo do cancelamento',
        driverName: 'Carlos',
        passengerName: 'João',
        routes: [],
      }

      mockFetchProtected.mockResolvedValue({ ok: true, data: mockDetail })

      const result = await cancelTravel('fake-token', 't-1', 'Motivo do cancelamento')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.status).toBe('Cancelled')
      }

      // Verify the body was sent correctly
      const callArgs = mockFetchProtected.mock.calls[0]
      expect(callArgs[2]).toMatchObject({
        method: 'POST',
        body: JSON.stringify({ reason: 'Motivo do cancelamento' }),
      })
    })

    it('returns 400 with validation message', async () => {
      mockFetchProtected.mockResolvedValue({ ok: false, status: 400 })

      const result = await cancelTravel('fake-token', 't-1', '')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(400)
        expect(result.message).toBe('Motivo do cancelamento é obrigatório.')
      }
    })

    it('returns 409 with conflict message', async () => {
      mockFetchProtected.mockResolvedValue({ ok: false, status: 409 })

      const result = await cancelTravel('fake-token', 't-1', 'reason')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe(409)
        expect(result.message).toBe('Não é possível cancelar uma viagem neste status.')
      }
    })
  })
})
