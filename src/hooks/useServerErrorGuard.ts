import { useCallback, useState } from 'react'

export function useServerErrorGuard() {
  const [guard, setGuard] = useState<{
    fields: string[]
    snapshot: Record<string, string>
    message: string
  } | null>(null)

  const block = useCallback((fields: string | string[], snapshot: Record<string, string>, message: string) => {
    setGuard({ fields: Array.isArray(fields) ? fields : [fields], snapshot, message })
  }, [])

  const onFieldChange = useCallback((field: string, value: string) => {
    setGuard(prev => {
      if (!prev) return prev
      if (!prev.fields.includes(field)) return prev
      if (prev.snapshot[field] === value) return prev
      return null
    })
  }, [])

  const clear = useCallback(() => setGuard(null), [])

  const errorFor = useCallback(
    (field: string) => (guard?.fields.includes(field) ? guard.message : undefined),
    [guard],
  )

  return {
    isBlocked: guard !== null,
    blockMessage: guard?.message,
    block,
    onFieldChange,
    clear,
    errorFor,
  }
}
