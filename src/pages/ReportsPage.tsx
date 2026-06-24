import { useState, useCallback } from 'react'
import DateIntervalSelector from '../components/reports/DateIntervalSelector'
import PartitionTravelReportTable from '../components/reports/PartitionTravelReportTable'
import ExportCsvButton from '../components/reports/ExportCsvButton'
import ErrorBanner from '../components/dashboard/ErrorBanner'
import { usePartitionTravelReport } from '../hooks/usePartitionTravelReport'

function getDefaultStartDate(): string {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return firstOfMonth.toISOString().slice(0, 10)
}

function getDefaultEndDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(getDefaultStartDate)
  const [endDate, setEndDate] = useState(getDefaultEndDate)

  const [appliedStart, setAppliedStart] = useState(startDate)
  const [appliedEnd, setAppliedEnd] = useState(endDate)

  const { data, loading, error, refetch } = usePartitionTravelReport(appliedStart, appliedEnd)

  const [validationError, setValidationError] = useState<string | null>(null)

  const handleApply = useCallback(() => {
    if (!startDate || !endDate) {
      setValidationError('Selecione as datas inicial e final.')
      return
    }
    if (startDate > endDate) {
      setValidationError('A data inicial não pode ser posterior à data final.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    if (startDate > today || endDate > today) {
      setValidationError('As datas não podem estar no futuro.')
      return
    }
    setValidationError(null)
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
  }, [startDate, endDate])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>

      <DateIntervalSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={handleApply}
        validationError={validationError}
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Corridas por Unidade</h2>
          <ExportCsvButton startDate={appliedStart} endDate={appliedEnd} />
        </div>
        <PartitionTravelReportTable data={data} loading={loading} />
      </section>
    </div>
  )
}
