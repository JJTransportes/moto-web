import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { downloadPartitionTravelReportCsv } from '../../api/reportApi'
import AppButton from '../AppButton'

interface Props {
  startDate: string
  endDate: string
}

export default function ExportCsvButton({ startDate, endDate }: Props) {
  const { token } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExport = async () => {
    if (!token) return
    setExporting(true)
    setExportError(null)
    try {
      await downloadPartitionTravelReportCsv(token, startDate, endDate)
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Erro ao gerar CSV.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {exportError && (
        <p className="text-sm text-red-600">{exportError}</p>
      )}
      <AppButton
        onClick={handleExport}
        disabled={exporting}
        variant="secondary"
      >
        {exporting ? 'Gerando...' : 'Gerar Relatório'}
      </AppButton>
    </div>
  )
}
