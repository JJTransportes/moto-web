import type { TravelStatus } from '../../types/travel'

interface TravelStatusBadgeProps {
  status: TravelStatus
}

const statusConfig: Record<TravelStatus, { label: string; className: string }> = {
  Pending:    { label: 'Pendente',     className: 'bg-yellow-100 text-yellow-800' },
  Accepted:   { label: 'Aceita',       className: 'bg-blue-100 text-blue-800' },
  InProgress: { label: 'Em Andamento', className: 'bg-green-100 text-green-800' },
  Completed:  { label: 'Concluída',    className: 'bg-gray-100 text-gray-700' },
  Cancelled:  { label: 'Cancelada',    className: 'bg-red-100 text-red-800' },
}

export default function TravelStatusBadge({ status }: TravelStatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
