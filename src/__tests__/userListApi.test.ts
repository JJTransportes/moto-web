import { describe, it, expect } from 'vitest'
import { listDrivers, listPassengers } from '../api/userListApi'

// We test URL construction by mocking fetch
const originalFetch = globalThis.fetch

function mockFetch(responseData: unknown, status = 200) {
  globalThis.fetch = (async (_url: RequestInfo | URL) => {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => responseData,
    } as Response
  }) as typeof globalThis.fetch
}

function restoreFetch() {
  globalThis.fetch = originalFetch
}

describe('userListApi — listDrivers', () => {
  it('builds correct URL without search', async () => {
    let capturedUrl = ''
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      capturedUrl = url.toString()
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
      } as Response
    }) as typeof globalThis.fetch

    await listDrivers('token', 1, 20)

    expect(capturedUrl).toContain('/api/drivers?')
    expect(capturedUrl).toContain('page=1')
    expect(capturedUrl).toContain('pageSize=20')
    expect(capturedUrl).not.toContain('search=')
  })

  it('builds correct URL with search', async () => {
    let capturedUrl = ''
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      capturedUrl = url.toString()
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
      } as Response
    }) as typeof globalThis.fetch

    await listDrivers('token', 2, 10, 'joão')

    expect(capturedUrl).toContain('/api/drivers?')
    expect(capturedUrl).toContain('page=2')
    expect(capturedUrl).toContain('pageSize=10')
    expect(capturedUrl).toContain('search=')
  })

  it('returns success result with data', async () => {
    const mockData = { items: [], page: 1, pageSize: 20, totalCount: 0 }
    mockFetch(mockData)

    const result = await listDrivers('token', 1, 20)
    restoreFetch()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual(mockData)
    }
  })

  it('returns error result on failure', async () => {
    mockFetch({}, 500)
    const result = await listDrivers('token', 1, 20)
    restoreFetch()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(500)
    }
  })
})

describe('userListApi — listPassengers', () => {
  it('builds correct URL without search', async () => {
    let capturedUrl = ''
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      capturedUrl = url.toString()
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
      } as Response
    }) as typeof globalThis.fetch

    await listPassengers('token', 1, 20)

    expect(capturedUrl).toContain('/api/passengers?')
    expect(capturedUrl).toContain('page=1')
    expect(capturedUrl).toContain('pageSize=20')
  })

  it('builds correct URL with search', async () => {
    let capturedUrl = ''
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      capturedUrl = url.toString()
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
      } as Response
    }) as typeof globalThis.fetch

    await listPassengers('token', 1, 20, 'maria')

    expect(capturedUrl).toContain('/api/passengers?')
    expect(capturedUrl).toContain('search=')
  })

  it('returns error on network failure', async () => {
    globalThis.fetch = (async () => {
      throw new Error('Network error')
    }) as typeof globalThis.fetch

    const result = await listPassengers('token', 1, 20)
    restoreFetch()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(0)
    }
  })
})
