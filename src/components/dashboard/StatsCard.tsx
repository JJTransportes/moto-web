import type { ReactNode } from 'react'

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtitle?: string
  accentColor: 'blue' | 'amber' | 'green'
}

const accentMap: Record<string, string> = {
  blue: 'border-l-blue-500',
  amber: 'border-l-amber-500',
  green: 'border-l-green-500',
}

const iconColorMap: Record<string, string> = {
  blue: 'text-blue-500',
  amber: 'text-amber-500',
  green: 'text-green-500',
}

export default function StatsCard({ icon, label, value, subtitle, accentColor }: StatsCardProps) {
  return (
    <div
      className={`rounded-lg border-l-4 ${accentMap[accentColor]} bg-white p-5 shadow-sm`}
    >
      <div className="flex items-center gap-4">
        <div className={`${iconColorMap[accentColor]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
