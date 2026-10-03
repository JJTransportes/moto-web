import type { OnlineUserDto, TodayTravelDto } from '../../types/map'
import UserAvatar from '../UserAvatar'

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

function valueOrDash(value?: string | null): string {
  return value?.trim() || 'Não informado'
}

export default function MapInfoWindowContent({ type, data }: MapInfoWindowContentProps) {
  if (type === 'user') {
    const user = data as OnlineUserDto
    const vehicle = [user.vehicleBrand, user.vehicleModel].filter(Boolean).join(' ')
    const hasLastTravel = Boolean(
      user.lastTravelDepartureAddress || user.lastTravelDestinationAddress,
    )

    return (
      <div className="w-[340px] max-w-[calc(100vw-80px)] p-1">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <UserAvatar photoUrl={user.photoUrl} fullName={user.fullName} size="md" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{user.fullName}</p>
            <p className="text-sm text-slate-500">
              {user.role === 'Driver' ? 'Motorista disponível' : 'Passageiro'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{formatTimeAgo(user.lastUpdated)}</p>
          </div>
        </div>

        {user.role === 'Driver' && (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <span className="font-medium text-slate-500">CPF:</span>
              <span className="break-words text-slate-800">{valueOrDash(user.cpf)}</span>
              <span className="font-medium text-slate-500">E-mail:</span>
              <span className="break-all text-slate-800">{valueOrDash(user.email)}</span>
              <span className="font-medium text-slate-500">Telefone:</span>
              <span className="break-words text-slate-800">{valueOrDash(user.phone)}</span>
              <span className="font-medium text-slate-500">Veículo:</span>
              <span className="break-words text-slate-800">
                {vehicle || 'Nenhum veículo vinculado'}
                {user.vehiclePlate ? ` • ${user.vehiclePlate}` : ''}
              </span>
              <span className="font-medium text-slate-500">Categoria:</span>
              <span className="break-words text-slate-800">
                {user.vehiclePlate ? valueOrDash(user.vehicleCategory) : 'Não se aplica'}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Última viagem
              </p>
              {hasLastTravel ? (
                <div className="mt-2 grid grid-cols-[34px_1fr] gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold text-slate-500">De:</span>
                  <span className="break-words text-slate-800">
                    {valueOrDash(user.lastTravelDepartureAddress)}
                  </span>
                  <span className="font-semibold text-slate-500">Para:</span>
                  <span className="break-words text-slate-800">
                    {valueOrDash(user.lastTravelDestinationAddress)}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-800">Nenhuma viagem concluída</p>
              )}
              {user.lastTravelFinishedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Finalizada em {new Date(user.lastTravelFinishedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        )}

        {user.role === 'Passenger' && (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="grid grid-cols-[82px_1fr] gap-2">
              <span className="font-medium text-slate-500">Nome:</span>
              <span className="break-words text-slate-800">{user.fullName}</span>
              <span className="font-medium text-slate-500">Secretaria:</span>
              <span className="break-words text-slate-800">
                {valueOrDash(user.department)}
              </span>
              <span className="font-medium text-slate-500">E-mail:</span>
              <span className="break-all text-slate-800">{valueOrDash(user.email)}</span>
              <span className="font-medium text-slate-500">Telefone:</span>
              <span className="break-words text-slate-800">{valueOrDash(user.phone)}</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Última viagem
              </p>
              {hasLastTravel ? (
                <div className="mt-2 grid grid-cols-[34px_1fr] gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold text-slate-500">De:</span>
                  <span className="break-words text-slate-800">
                    {valueOrDash(user.lastTravelDepartureAddress)}
                  </span>
                  <span className="font-semibold text-slate-500">Para:</span>
                  <span className="break-words text-slate-800">
                    {valueOrDash(user.lastTravelDestinationAddress)}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-800">Nenhuma viagem concluída</p>
              )}
              {user.lastTravelFinishedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Finalizada em {new Date(user.lastTravelFinishedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const travel = data as TodayTravelDto
  const statusLabel =
    travel.status === 'InProgress' ? 'Viagem em andamento' : 'A caminho do passageiro'

  const statusColor =
    travel.status === 'InProgress' ? 'text-[#166534]' : 'text-blue-700'

  return (
    <div className="min-w-[260px] p-1">
      <p className={`font-semibold text-sm ${statusColor}`}>{statusLabel}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar
            photoUrl={travel.driverPhotoUrl}
            fullName={travel.driverName ?? 'Motorista'}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">
              {travel.driverName ?? 'Motorista'}
            </p>
            <p className="text-[11px] text-slate-500">Motorista</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar
            photoUrl={travel.passengerPhotoUrl}
            fullName={travel.passengerName}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">
              {travel.passengerName}
            </p>
            <p className="text-[11px] text-slate-500">Passageiro</p>
          </div>
        </div>
      </div>
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
        {(travel.vehicleBrand || travel.vehicleModel || travel.vehiclePlate) && (
          <p>
            <span className="font-medium">Veículo:</span>{' '}
            {[travel.vehicleBrand, travel.vehicleModel].filter(Boolean).join(' ')}
            {travel.vehiclePlate ? ` • ${travel.vehiclePlate}` : ''}
          </p>
        )}
        {travel.startedAt && (
          <p><span className="font-medium">Iniciada:</span> {formatTimeAgo(travel.startedAt)}</p>
        )}
      </div>
    </div>
  )
}
