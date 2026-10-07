import { useState, useCallback, useMemo } from 'react'
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
  const [unitSearch, setUnitSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [onlyWithTravels, setOnlyWithTravels] = useState(false)

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map(item => item.categoryTitle).filter(Boolean) as string[])).sort(),
    [data],
  )

  const filteredData = useMemo(() => {
    const query = unitSearch.trim().toLocaleLowerCase('pt-BR')
    return (data ?? []).filter(item => {
      if (query && !item.publicPartitionName.toLocaleLowerCase('pt-BR').includes(query)) return false
      if (categoryFilter !== 'all' && item.categoryTitle !== categoryFilter) return false
      if (onlyWithTravels && item.totalTravels === 0) return false
      return true
    })
  }, [data, unitSearch, categoryFilter, onlyWithTravels])

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
        <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] md:items-end">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Filtrar por unidade</span>
            <input
              value={unitSearch}
              onChange={event => setUnitSearch(event.target.value)}
              placeholder="Digite o nome da unidade"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Categoria</span>
            <select
              value={categoryFilter}
              onChange={event => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Todas</option>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={onlyWithTravels}
              onChange={event => setOnlyWithTravels(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Somente com corridas
          </label>
        </div>
        {!loading && data && (
          <p className="mb-3 text-sm text-gray-500">
            {filteredData.length} de {data.length} registros exibidos
          </p>
        )}
        <PartitionTravelReportTable data={filteredData} loading={loading} />
      </section>
    </div>
  )
}
