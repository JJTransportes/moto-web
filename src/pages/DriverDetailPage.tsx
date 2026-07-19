import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  fetchDriverProfile,
  changeDriverVehicle,
  fetchUserProfilePhoto,
  deleteUserAccount,
  type DriverProfile,
} from '../api/userApi'
import { fetchAvailableVehicles, type AvailableVehicle } from '../api/vehicleApi'
import ConfirmationModal from '../components/ConfirmationModal'
import FormField from '../components/FormField'
import UserAvatar from '../components/UserAvatar'
import { ArrowLeft, Car, User, Mail, Loader2, Trash2, AlertTriangle } from 'lucide-react'

type PageStatus = 'loading' | 'loaded' | 'error' | 'notFound'

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-20 bg-gray-200 rounded-xl" />
    </div>
  )
}

export default function DriverDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Vehicle switching state
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState<string>()

  // Deletion state
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()
  const [successMessage, setSuccessMessage] = useState<string | undefined>()

  const loadDriver = useCallback(async () => {
    if (!token || !userId) return
    setPageStatus('loading')
    setErrorMessage(undefined)

    const result = await fetchDriverProfile(token, userId)
    if (result.ok) {
      setDriver(result.data)
      setPageStatus('loaded')

      // Fetch profile photo
      const photoResult = await fetchUserProfilePhoto(token, userId)
      if (photoResult.ok) {
        setPhotoUrl(photoResult.data.photoUrl)
      }
    } else if (result.status === 404) {
      setPageStatus('notFound')
    } else {
      setErrorMessage(result.message)
      setPageStatus('error')
    }
  }, [token, userId])

  const loadAvailableVehicles = useCallback(async () => {
    if (!token) return
    setVehiclesLoading(true)
    const result = await fetchAvailableVehicles(token)
    setVehiclesLoading(false)
    if (result.ok) setVehicles(result.data)
  }, [token])

  useEffect(() => {
    loadDriver()
    loadAvailableVehicles()
  }, [loadDriver, loadAvailableVehicles])

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(undefined), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleDelete = useCallback(async (adminCode: string) => {
    if (!token || !userId) return
    setDeleting(true)
    setDeleteError(undefined)

    const result = await deleteUserAccount(token, userId, adminCode)

    if (result.ok) {
      setDeleting(false)
      setDeleteError(undefined)
      setSuccessMessage('Conta excluída com sucesso.')
      await loadDriver()
    } else if (result.status === 401) {
      setDeleteError(result.message)
      setDeleting(false)
    } else {
      setDeleting(false)
      setDeleteError(undefined)
      setSuccessMessage(result.message)
    }
  }, [token, userId, loadDriver])

  const handleSwitchVehicle = async () => {
    if (!token || !userId || !selectedVehicleId) return
    setSwitching(true)
    setSwitchError(undefined)

    const result = await changeDriverVehicle(token, userId, selectedVehicleId)
    if (result.ok) {
      setSelectedVehicleId('')
      setSwitchError(undefined)
      // Reload driver profile and available vehicles
      await loadDriver()
      await loadAvailableVehicles()
    } else {
      setSwitchError(result.message)
    }
    setSwitching(false)
  }

  const canSwitch = selectedVehicleId && !switching

  if (pageStatus === 'loading') return <DetailSkeleton />

  if (pageStatus === 'notFound') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-800">Motorista não encontrado</h2>
        <p className="mt-2 text-gray-500">O motorista solicitado não existe ou foi removido.</p>
        <button
          onClick={() => navigate('/users')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Usuários
        </button>
      </div>
    )
  }

  if (pageStatus === 'error') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            <button
              onClick={loadDriver}
              className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!driver) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <UserAvatar photoUrl={photoUrl} fullName={driver.fullName} size="lg" />
        <h1 className="text-2xl font-bold text-gray-800">{driver.fullName}</h1>
      </div>

      {/* Driver Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          icon={<User className="h-4 w-4 text-blue-500" />}
          label="Nome completo"
          value={driver.fullName}
        />
        <InfoCard
          icon={<Mail className="h-4 w-4 text-blue-500" />}
          label="E-mail"
          value={driver.email}
        />
        {driver.cpf && <InfoCard label="CPF" value={driver.cpf} />}
        {driver.cnh && <InfoCard label="CNH" value={driver.cnh} />}
        {driver.department && (
          <InfoCard label="Departamento" value={driver.department} />
        )}
      </div>

      {/* Current Vehicle */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-700">
          <Car className="h-5 w-5 text-blue-600" />
          Veículo atual
        </h2>
        {driver.vehicle ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Marca</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{driver.vehicle.brand}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Modelo</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{driver.vehicle.model}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Ano</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{driver.vehicle.year}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Placa</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{driver.vehicle.plate}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum veículo associado.</p>
        )}
      </div>

      {/* Vehicle Switching */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-700">Alterar veículo</h2>
        <p className="mb-4 text-sm text-gray-500">
          Selecione um veículo disponível para associar a este motorista. O veículo atual será
          desassociado automaticamente.
        </p>

        {vehiclesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando veículos disponíveis...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-700">
              Nenhum veículo disponível no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <FormField
              id="switchVehicle"
              label="Veículo disponível"
              type="select"
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
              options={vehicles.map(v => ({
                value: v.vehicleId,
                label: `${v.brand} ${v.model} - ${v.plate}${v.categoryTitle ? ` (${v.categoryTitle})` : ''}`,
              }))}
            />
            <button
              onClick={handleSwitchVehicle}
              disabled={!canSwitch}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {switching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar veículo'
              )}
            </button>
            {switchError && (
              <p className="text-sm text-red-600" role="alert">{switchError}</p>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {userId !== user?.userId && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </h2>
          <p className="mb-4 text-sm text-red-600">
            Excluir esta conta irá desativá-la permanentemente. O motorista não poderá mais
            acessar o sistema ou realizar viagens.
          </p>
          <button
            onClick={() => setDeleting(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Excluir conta
          </button>
        </div>
      )}

      {/* Success notification */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleting}
        title="Excluir conta"
        description={`Tem certeza que deseja excluir a conta de ${driver.fullName}? Esta ação é irreversível.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(false)
          setDeleteError(undefined)
        }}
        loading={deleting}
        error={deleteError}
      />
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}
