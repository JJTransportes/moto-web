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
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(adminCode)}
            disabled={loading || !adminCode}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
