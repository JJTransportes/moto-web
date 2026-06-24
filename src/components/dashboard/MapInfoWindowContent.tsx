import type { OnlineUserDto, TodayTravelDto } from '../../types/map'

interface MapInfoWindowContentProps {
  type: 'user' | 'travel'
  data: OnlineUserDto | TodayTravelDto
}

function formatTimeAgo(dateStr: string): string {
  const diff = new Date().getTime() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Agora mesmo'
  if (minutes < 60) return `Atualizado há ${minutes} min`
  return new Date(dateStr).toLocaleString('pt-BR')
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${meters} m`
}

export default function MapInfoWindowContent({ type, data }: MapInfoWindowContentProps) {
  if (type === 'user') {
    const user = data as OnlineUserDto
    return (
      <div className="min-w-[200px] p-1">
        <p className="font-semibold text-slate-800">{user.fullName}</p>
        <p className="text-sm text-slate-500">
          {user.role === 'Driver' ? 'Motorista' : 'Passageiro'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {formatTimeAgo(user.lastUpdated)}
        </p>
      </div>
    )
  }

  const travel = data as TodayTravelDto
  const statusLabel =
    travel.status === 'InProgress'
      ? 'Em andamento'
      : travel.status === 'Completed'
        ? 'Concluída'
        : travel.status === 'Cancelled'
          ? 'Cancelada'
          : 'Pendente'

  const statusColor =
    travel.status === 'InProgress'
      ? 'text-orange-600'
      : travel.status === 'Completed'
        ? 'text-green-600'
        : travel.status === 'Cancelled'
          ? 'text-red-600'
          : 'text-yellow-600'

  return (
    <div className="min-w-[260px] p-1">
      <p className={`font-semibold text-sm ${statusColor}`}>{statusLabel}</p>
      <div className="mt-2 space-y-1 text-sm text-slate-600">
        <p>
          <span className="font-medium">Origem:</span> {travel.departureAddress}
        </p>
        <p>
          <span className="font-medium">Destino:</span> {travel.destinationAddress}
        </p>
        <p>
          <span className="font-medium">Distância:</span>{' '}
          {formatDistance(travel.routeDistanceInMeters)}
        </p>
        <p>
          <span className="font-medium">Duração est.:</span> {travel.averageTimeInMinutes} min
        </p>
        {travel.driverName && (
          <p>
            <span className="font-medium">Motorista:</span> {travel.driverName}
          </p>
        )}
        <p>
          <span className="font-medium">Passageiro:</span> {travel.passengerName}
        </p>
      </div>
    </div>
  )
}
