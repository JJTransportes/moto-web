import AppButton from '../AppButton'

interface DateIntervalSelectorProps {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onApply: () => void
  validationError: string | null
}

export default function DateIntervalSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  validationError,
}: DateIntervalSelectorProps) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="report-start-date" className="mb-1 block text-sm font-medium text-gray-700">
            Data Inicial
          </label>
          <input
            id="report-start-date"
            type="date"
            value={startDate}
            max={today}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="report-end-date" className="mb-1 block text-sm font-medium text-gray-700">
            Data Final
          </label>
          <input
            id="report-end-date"
            type="date"
            value={endDate}
            max={today}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <AppButton onClick={onApply} variant="primary">
          Filtrar
        </AppButton>
      </div>

      {validationError && (
        <p className="mt-2 text-sm text-red-600">{validationError}</p>
      )}
    </div>
  )
}
