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
        className="mo-surface flex items-start gap-3 border-[var(--sinal-500)] px-4 py-3"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--success)]" />
        <p className="flex-1 text-sm font-medium text-[var(--success)]">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="mo-focus flex-shrink-0 rounded-full text-[var(--success)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
