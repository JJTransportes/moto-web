import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface FormFieldProps {
  id?: string
  type?: 'text' | 'email' | 'password' | 'date' | 'select'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  options?: SelectOption[]
  label?: string
  maxLength?: number
  /** Soft limit: doesn't block typing, only shows a warning once exceeded. */
  softMaxLength?: number
  /** Blocks non-digit keystrokes and shows a transient warning. */
  digitsOnly?: boolean
  mask?: (value: string) => string
}

export default function FormField({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled,
  options,
  label,
  maxLength,
  softMaxLength,
  digitsOnly,
  mask,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [keyWarning, setKeyWarning] = useState<string | undefined>()
  const warningTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(warningTimeout.current), [])

  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type

  const softLimitMessage =
    softMaxLength && value.length > softMaxLength
      ? `Este campo ultrapassou o limite de ${softMaxLength} caracteres.`
      : undefined

  const displayError = keyWarning ?? error ?? softLimitMessage

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!digitsOnly) return
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
    if (!/\d/.test(e.key)) {
      e.preventDefault()
      setKeyWarning('Somente números são permitidos.')
      clearTimeout(warningTimeout.current)
      warningTimeout.current = setTimeout(() => setKeyWarning(undefined), 2000)
    }
  }

  const inputClass = `w-full rounded-lg border px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
    isPassword ? 'pr-11' : ''
  } ${displayError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
        >
          <option value="">Selecione...</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            id={id}
            type={resolvedType}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(mask ? mask(e.target.value) : e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={maxLength}
            className={inputClass}
            aria-describedby={displayError ? `${id}-error` : undefined}
            aria-invalid={displayError ? true : undefined}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              disabled={disabled}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      )}
      {displayError && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
