interface DashboardViewSelectorProps {
  activeView: 'stats' | 'map'
  onChange: (view: 'stats' | 'map') => void
}

export default function DashboardViewSelector({
  activeView,
  onChange,
}: DashboardViewSelectorProps) {
  const activeClass =
    'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm'
  const inactiveClass =
    'rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'

  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      <button
        onClick={() => onChange('stats')}
        className={activeView === 'stats' ? activeClass : inactiveClass}
      >
        Dados Gerais
      </button>
      <button
        onClick={() => onChange('map')}
        className={activeView === 'map' ? activeClass : inactiveClass}
      >
        Mapa
      </button>
    </div>
  )
}
