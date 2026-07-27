import { describe, it, expect, afterEach, vi } from 'vitest'
import { fetchProtected } from '../api/authApi'
import {
  listPartitions,
  getPartition,
  createPartition,
  updatePartition,
  deletePartition,
} from '../api/publicPartitionApi'

vi.mock('../api/authApi', () => ({
  fetchProtected: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchProtected)

const TOKEN = 'test-token'

const SUMMARY = {
  partitionId: 'pid-1',
  name: 'SMTT',
  identifier: 'SMTT-001',
  acronym: 'SMTT',
  departments: 'Transporte',
  categoryIds: ['cat-1'],
  categoryTitles: ['Transporte'],
}

const DETAIL = {
  partitionId: 'pid-1',
  name: 'SMTT',
  identifier: 'SMTT-001',
  acronym: 'SMTT',
  departments: 'Transporte',
  adminId: null,
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

describe('publicPartitionApi', () => {
  afterEach(() => vi.clearAllMocks())

  describe('listPartitions', () => {
    it('returns data on success', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: [SUMMARY] })
      const result = await listPartitions(TOKEN)
      expect(result).toEqual({ ok: true, data: [SUMMARY] })
      expect(result.ok && result.data[0].partitionId).toBe('pid-1')
      expect(result.ok && result.data[0].name).toBe('SMTT')
    })

    it('returns error on failure', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await listPartitions(TOKEN)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(500)
    })

    it('preserves partitionId and name for backward compatibility', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: [SUMMARY] })
      const result = await listPartitions(TOKEN)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data[0].partitionId).toBeDefined()
        expect(result.data[0].name).toBeDefined()
      }
    })
  })

  describe('getPartition', () => {
    it('returns partition detail on success', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: DETAIL })
      const result = await getPartition(TOKEN, 'pid-1')
      expect(result).toEqual({ ok: true, data: DETAIL })
    })

    it('returns 404 on not found', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      const result = await getPartition(TOKEN, 'pid-x')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(404)
    })
  })

  describe('createPartition', () => {
    const input = {
      name: 'SMTT',
      identifier: 'SMTT-001',
      acronym: 'SMTT',
      departments: ['Transporte'],
      categoryIds: ['cat-1'],
      adminCode: 'ADMIN-001',
      adminId: 'admin-uuid',
      address: { lineOne: 'Rua A, 1', city: 'Maceió', state: 'AL', countryCode: 'BR' },
    }

    it('calls POST with inline address and returns detail', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: { ...DETAIL, adminId: 'admin-uuid' } })
      const result = await createPartition(TOKEN, input)
      expect(result).toEqual({ ok: true, data: { ...DETAIL, adminId: 'admin-uuid' } })
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/public-partitions/new',
        TOKEN,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        }),
      )
    })

    it('returns 409 on conflict', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 409 })
      const result = await createPartition(TOKEN, input)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(409)
    })

    it('returns 401 on unauthorized', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 401 })
      const result = await createPartition(TOKEN, input)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(401)
    })
  })

  describe('updatePartition', () => {
    const input = {
      name: 'Updated',
      identifier: 'ID-002',
      acronym: 'UPD',
      departments: ['Sec'],
      categoryIds: ['cat-1'],
      adminCode: 'ADMIN-001',
      adminId: null,
      address: { lineOne: 'Rua B, 2', city: 'Arapiraca', state: 'AL', countryCode: 'BR' },
    }

    it('calls PUT and returns updated detail', async () => {
      const updated = { ...DETAIL, name: 'Updated' }
      mockedFetch.mockResolvedValueOnce({ ok: true, data: updated })
      const result = await updatePartition(TOKEN, 'pid-1', input)
      expect(result).toEqual({ ok: true, data: updated })
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/public-partitions/pid-1',
        TOKEN,
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    it('returns 404 when partition not found', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      const result = await updatePartition(TOKEN, 'pid-x', input)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(404)
    })
  })

  describe('deletePartition', () => {
    it('returns ok on success', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: true, data: undefined })
      const result = await deletePartition(TOKEN, 'pid-1')
      expect(result).toEqual({ ok: true })
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/public-partitions/pid-1',
        TOKEN,
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('returns 409 when partition is referenced', async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false, status: 409 })
      const result = await deletePartition(TOKEN, 'pid-1')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(409)
    })
  })
})
