import { useEffect, useRef, useState } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: (adminCode: string) => void
  onCancel: () => void
  loading: boolean
  error?: string
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
  error,
}: ConfirmationModalProps) {
  const [adminCode, setAdminCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setAdminCode('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="mo-surface w-full max-w-md p-6">
        <h2 id="modal-title" className="mb-2 text-lg font-semibold text-gray-800">
          {title}
        </h2>
        <p className="mb-4 text-sm text-gray-600">{description}</p>

        <label htmlFor="admin-code" className="mb-1 block text-sm font-medium text-gray-700">
          Código do administrador
        </label>
        <input
          ref={inputRef}
          id="admin-code"
          type="password"
          value={adminCode}
          onChange={e => setAdminCode(e.target.value)}
          disabled={loading}
          placeholder="Digite sua senha"
          className="mo-focus mb-4 min-h-12 w-full rounded-[18px] border border-[var(--border-default)] bg-[var(--porcelana-50)] px-4 py-3 text-sm outline-none disabled:opacity-60"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="mo-focus min-h-12 rounded-full border border-[var(--border-default)] px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(adminCode)}
            disabled={loading || !adminCode}
            className="mo-focus min-h-12 rounded-full bg-cobalto px-5 py-2 text-sm font-semibold text-white shadow-moto hover:brightness-105 disabled:opacity-50"
            aria-busy={loading || undefined}
          >
            {loading ? 'Aguarde...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
