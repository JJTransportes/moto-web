import { useState, useMemo } from 'react'
import type { PartitionTravelReportItem } from '../../types/reports'

interface SortConfig {
  key: keyof PartitionTravelReportItem
  direction: 'asc' | 'desc'
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 text-gray-300">↕</span>
  return <span className="ml-1 text-blue-600">{direction === 'asc' ? '↑' : '↓'}</span>
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: PartitionTravelReportItem[] | null
  loading: boolean
}

type ColumnKey = keyof PartitionTravelReportItem

const COLUMNS: { key: ColumnKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'publicPartitionName', label: 'Unidade Pública', align: 'left' },
  { key: 'categoryTitle', label: 'Categoria', align: 'left' },
  { key: 'totalTravels', label: 'Corridas', align: 'right' },
  { key: 'totalDistanceInMeters', label: 'Distância', align: 'right' },
  { key: 'totalDurationInMinutes', label: 'Duração', align: 'right' },
]

export default function PartitionTravelReportTable({ data, loading }: Props) {
  const [sort, setSort] = useState<SortConfig>({ key: 'totalTravels', direction: 'desc' })

  const sorted = useMemo(() => {
    if (!data) return null
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sort.key]
      const bVal = b[sort.key]
      const aNum = typeof aVal === 'number' ? aVal : 0
      const bNum = typeof bVal === 'number' ? bVal : 0
      const aStr = (aVal ?? '').toString().toLowerCase()
      const bStr = (bVal ?? '').toString().toLowerCase()

      let cmp: number
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aNum - bNum
      } else {
        cmp = aStr.localeCompare(bStr)
      }
      return sort.direction === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [data, sort])

  const handleSort = (key: ColumnKey) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  if (loading) return <TableSkeleton />

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">Nenhuma unidade pública registrada.</p>
      </div>
    )
  }

  const formatCell = (item: PartitionTravelReportItem, key: ColumnKey): string => {
    switch (key) {
      case 'publicPartitionName':
        return item.publicPartitionName
      case 'categoryTitle':
        return item.categoryTitle ?? '—'
      case 'totalTravels':
        return String(item.totalTravels)
      case 'totalDistanceInMeters':
        return formatDistance(item.totalDistanceInMeters)
      case 'totalDurationInMinutes':
        return formatDuration(item.totalDurationInMinutes)
      default:
        return ''
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`cursor-pointer select-none px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
                <SortIcon active={sort.key === col.key} direction={sort.direction} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted!.map(item => (
            <tr key={item.publicPartitionId} className="even:bg-gray-50/50 hover:bg-gray-50">
              {COLUMNS.map(col => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm text-gray-700 ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.key === 'publicPartitionName' ? 'max-w-48 truncate' : ''}`}
                >
                  {formatCell(item, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
