import { CheckCircle2 } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  title: string
  description: string
  buttonLabel: string
  onConfirm: () => void
}

export default function SuccessModal({
  isOpen,
  title,
  description,
  buttonLabel,
  onConfirm,
}: SuccessModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 id="success-modal-title" className="mb-2 text-lg font-semibold text-gray-800">
          {title}
        </h2>
        <p className="mb-6 text-sm text-gray-600">{description}</p>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
