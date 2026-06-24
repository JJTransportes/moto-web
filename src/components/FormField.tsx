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
}: FormFieldProps) {
  const inputClass = `w-full rounded-lg border px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  }`

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
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
