import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchVehicle, deleteVehicle, type Vehicle } from '../api/vehicleApi'
import ConfirmationModal from '../components/ConfirmationModal'
import { Car, Pencil, Trash2 } from 'lucide-react'

type PageStatus = 'loading' | 'loaded' | 'not-found' | 'error'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FleetDetailPage() {
  const { token, hasMinimumRole } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [status, setStatus] = useState<PageStatus>('loading')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()

  useEffect(() => {
    if (!token || !vehicleId) return
    setStatus('loading')
    fetchVehicle(token, vehicleId).then(result => {
      if (!result.ok) {
        setStatus(result.status === 404 ? 'not-found' : 'error')
        return
      }
      setVehicle(result.data)
      setStatus('loaded')
    })
  }, [token, vehicleId])

  async function handleDelete(adminCode: string) {
    if (!token || !vehicleId) return
    setDeleteLoading(true)
    setDeleteError(undefined)
    const result = await deleteVehicle(token, vehicleId)
    setDeleteLoading(false)
    if (result.ok) {
      navigate('/fleets')
    } else {
      setDeleteError(result.message)
    }
    void adminCode
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-slate-50 p-12 text-center">
          <p className="text-gray-500">Veículo não encontrado.</p>
          <Link to="/fleets" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'error' || !vehicle) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">Erro ao carregar veículo. Tente novamente.</p>
          <Link to="/fleets" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = vehicle.driverId === null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/fleets" className="text-sm text-blue-600 hover:underline">
            ← Frotas
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">
            {vehicle.brand} {vehicle.model}
          </h1>
        </div>
        {isGlobalAdmin && (
          <div className="flex gap-2">
            <Link
              to={`/fleets/${vehicle.vehicleId}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-4">
        {isAvailable ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
            Disponível
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500" />
            Em uso
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Vehicle information */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Informações do veículo</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Marca</dt>
              <dd className="font-medium text-gray-900">{vehicle.brand}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Modelo</dt>
              <dd className="font-medium text-gray-900">{vehicle.model}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Ano</dt>
              <dd className="font-medium text-gray-900">{vehicle.year}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Placa</dt>
              <dd className="font-medium text-gray-900 font-mono">{vehicle.plate}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Categoria</dt>
              <dd className="font-medium text-gray-900">{vehicle.categoryTitle ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Driver information */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Motorista</h2>
          {vehicle.driverName ? (
            <dl className="text-sm">
              <dt className="text-gray-500">Nome</dt>
              <dd className="font-medium text-gray-900">{vehicle.driverName}</dd>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">Nenhum motorista associado.</p>
          )}
        </div>

        {/* Dates */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Datas</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Cadastrado em</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(vehicle.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Atualizado em</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(vehicle.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Excluir veículo"
        description="Esta ação não pode ser desfeita. Digite seu código de administrador para confirmar."
        onConfirm={handleDelete}
        onCancel={() => { setDeleteModalOpen(false); setDeleteError(undefined) }}
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  )
}
