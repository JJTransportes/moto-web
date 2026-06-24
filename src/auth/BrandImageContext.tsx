import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { fetchBrandImageUrl } from '../api/configApi'

interface BrandImageContextValue {
  brandImageUrl: string | null
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const BrandImageContext = createContext<BrandImageContextValue | null>(null)

export function BrandImageProvider({ children }: { children: ReactNode }) {
  const [brandImageUrl, setBrandImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const prevUrlRef = useRef<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(false)

    const result = await fetchBrandImageUrl()

    if (result.ok) {
      // Revoke previous object URL to prevent memory leaks
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
      prevUrlRef.current = result.url
      setBrandImageUrl(result.url)
      setError(false)
    } else {
      setBrandImageUrl(null)
      setError(true)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch, refetchTrigger])

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
    }
  }, [])

  const refetch = useCallback(() => {
    setRefetchTrigger((n) => n + 1)
  }, [])

  const value = useMemo(
    () => ({ brandImageUrl, isLoading, error, refetch }),
    [brandImageUrl, isLoading, error, refetch],
  )

  return (
    <BrandImageContext.Provider value={value}>
      {children}
    </BrandImageContext.Provider>
  )
}

export function useBrandImage(): BrandImageContextValue {
  const ctx = useContext(BrandImageContext)
  if (!ctx)
    throw new Error('useBrandImage must be used within BrandImageProvider')
  return ctx
}
