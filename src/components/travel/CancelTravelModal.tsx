import { useEffect, useRef, useState } from 'react'

interface CancelTravelModalProps {
  isOpen: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
  error?: string
}

export default function CancelTravelModal({
  isOpen,
  onConfirm,
  onCancel,
  loading,
  error,
}: CancelTravelModalProps) {
  const [reason, setReason] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setReason('')
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

  const trimmed = reason.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="cancel-modal-title" className="mb-2 text-lg font-semibold text-gray-800">
          Cancelar Viagem
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Esta ação não pode ser desfeita. Por favor, informe o motivo do cancelamento.
        </p>

        <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-gray-700">
          Motivo do cancelamento <span className="text-red-500">*</span>
        </label>
        <textarea
          ref={inputRef}
          id="cancel-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="Descreva o motivo do cancelamento..."
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
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
            onClick={() => onConfirm(trimmed)}
            disabled={loading || !trimmed}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
