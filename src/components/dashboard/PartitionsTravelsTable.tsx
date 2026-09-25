import { useMemo, useState } from 'react'
import type { PartitionTravelSummary } from '../../types/dashboard'

interface PartitionsTravelsTableProps {
  partitions: PartitionTravelSummary[]
}

type SortKey = 'publicPartitionName' | 'totalTravels' | 'totalDurationInMinutes' | 'totalDistanceInMeters'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function formatDistance(meters: number): string {
  const km = meters / 1000
  if (km < 1) return `${Math.round(meters)}m`
  return `${km.toFixed(1)} km`
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  return (
    <span className="ml-1 inline-block text-xs" aria-hidden="true">
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

export default function PartitionsTravelsTable({ partitions }: PartitionsTravelsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalTravels')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    const copy = [...partitions]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'publicPartitionName':
          cmp = a.publicPartitionName.localeCompare(b.publicPartitionName)
          break
        case 'totalTravels':
          cmp = a.totalTravels - b.totalTravels
          break
        case 'totalDurationInMinutes':
          cmp = a.totalDurationInMinutes - b.totalDurationInMinutes
          break
        case 'totalDistanceInMeters':
          cmp = a.totalDistanceInMeters - b.totalDistanceInMeters
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [partitions, sortKey, sortDir])

  const headerClass = 'cursor-pointer p-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-cobalto'

  return (
    <div className="mo-surface overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--porcelana-50)]">
            <th
              className={headerClass}
              onClick={() => toggleSort('publicPartitionName')}
            >
              Unidade Pública
              <SortIcon active={sortKey === 'publicPartitionName'} direction={sortDir} />
            </th>
            <th
              className={headerClass}
              onClick={() => toggleSort('totalTravels')}
            >
              Corridas
              <SortIcon active={sortKey === 'totalTravels'} direction={sortDir} />
            </th>
            <th
              className={headerClass}
              onClick={() => toggleSort('totalDurationInMinutes')}
            >
              Duração
              <SortIcon active={sortKey === 'totalDurationInMinutes'} direction={sortDir} />
            </th>
            <th
              className={headerClass}
              onClick={() => toggleSort('totalDistanceInMeters')}
            >
              Distância
              <SortIcon active={sortKey === 'totalDistanceInMeters'} direction={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-sm text-gray-400">
                Nenhum dado disponível.
              </td>
            </tr>
          ) : (
            sorted.map((p) => (
              <tr key={p.publicPartitionId} className="transition-colors hover:bg-gray-50 even:bg-gray-50/50">
                <td className="max-w-48 truncate p-3 text-sm font-medium text-gray-900">
                  {p.publicPartitionName}
                </td>
                <td className="p-3 text-sm text-gray-700">{p.totalTravels}</td>
                <td className="p-3 text-sm text-gray-700">{formatDuration(p.totalDurationInMinutes)}</td>
                <td className="p-3 text-sm text-gray-700">{formatDistance(p.totalDistanceInMeters)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
