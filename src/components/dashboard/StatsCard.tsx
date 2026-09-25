import type { ReactNode } from 'react'

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtitle?: string
  accentColor: 'blue' | 'amber' | 'green'
}

const accentMap: Record<StatsCardProps['accentColor'], string> = {
  blue: 'mo-sapphire',
  amber: 'border-l-4 border-l-[var(--ambar-500)]',
  green: 'border-l-4 border-l-[var(--sinal-500)]',
}

const iconColorMap: Record<StatsCardProps['accentColor'], string> = {
  blue: 'text-white',
  amber: 'text-[var(--warning)]',
  green: 'text-[var(--success)]',
}

export default function StatsCard({ icon, label, value, subtitle, accentColor }: StatsCardProps) {
  return (
    <div
      className={`mo-surface ${accentMap[accentColor]} p-5`}
    >
      <div className="flex items-center gap-4">
        <div className={`${iconColorMap[accentColor]}`}>{icon}</div>
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${accentColor === 'blue' ? 'text-blue-100' : 'text-[var(--text-tertiary)]'}`}>{label}</p>
          <p className={`mo-num text-2xl font-bold ${accentColor === 'blue' ? 'text-white' : 'text-[var(--text-primary)]'}`}>{value}</p>
          {subtitle && <p className={`text-xs ${accentColor === 'blue' ? 'text-blue-100' : 'text-[var(--text-tertiary)]'}`}>{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
