import { Check, X } from 'lucide-react'
import { PASSWORD_REQUIREMENTS } from '../utils/validators'

interface PasswordRequirementsProps {
  password: string
}

/** Checklist de requisitos de senha, atualizado em tempo real (padrão gov.br). */
export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-600">A senha deve conter:</p>
      <ul className="flex flex-col gap-1">
        {PASSWORD_REQUIREMENTS.map(req => {
          const met = req.test(password)
          return (
            <li key={req.key} className={`flex items-center gap-2 text-xs ${met ? 'text-green-700' : 'text-gray-500'}`}>
              {met ? (
                <Check size={14} className="shrink-0 text-green-600" aria-hidden="true" />
              ) : (
                <X size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
              )}
              <span>{req.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
