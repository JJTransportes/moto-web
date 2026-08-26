import { CheckCircle2, X } from 'lucide-react'

interface ToastProps {
  message: string
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed right-4 top-4 z-[60] w-full max-w-sm animate-[fade-in_0.2s_ease-out]">
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
        <p className="flex-1 text-sm font-medium text-green-800">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex-shrink-0 text-green-500 hover:text-green-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
