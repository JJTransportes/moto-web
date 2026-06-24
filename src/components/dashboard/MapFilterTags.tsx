import type { FilterType } from '../../types/map'

interface MapFilterTagsProps {
  active: FilterType
  onChange: (filter: FilterType) => void
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'drivers', label: 'Motoristas' },
  { key: 'passengers', label: 'Passageiros' },
  { key: 'travels', label: 'Viagens' },
]

export default function MapFilterTags({ active, onChange }: MapFilterTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={
            active === f.key
              ? 'rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm'
              : 'rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50'
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
