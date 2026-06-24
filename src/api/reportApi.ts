import type { PartitionTravelReportItem } from '../types/reports'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function fetchPartitionTravelReport(
  token: string,
  startDate: string,
  endDate: string,
): Promise<PartitionTravelReportItem[]> {
  const params = new URLSearchParams({ startDate, endDate })
  const res = await fetch(`${BASE_URL}/api/reports/travels-by-partition?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    if (res.status === 400) {
      const body = await res.json().catch(() => null)
      throw new Error((body as { error?: string })?.error ?? 'Parâmetros inválidos.')
    }
    throw new Error(`Erro ao carregar relatório: ${res.status}`)
  }

  return (await res.json()) as PartitionTravelReportItem[]
}

export async function downloadPartitionTravelReportCsv(
  token: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  const params = new URLSearchParams({ startDate, endDate })
  const res = await fetch(`${BASE_URL}/api/reports/travels-by-partition/csv?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    if (res.status === 400) {
      const body = await res.json().catch(() => null)
      throw new Error((body as { error?: string })?.error ?? 'Parâmetros inválidos.')
    }
    throw new Error(`Erro ao gerar CSV: ${res.status}`)
  }

  const disposition = res.headers.get('Content-Disposition')
  const filenameMatch = disposition?.match(/filename="?(.+?)"?$/)
  const filename = filenameMatch?.[1] ?? `travels-by-partition-report-${startDate}_${endDate}.csv`

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
