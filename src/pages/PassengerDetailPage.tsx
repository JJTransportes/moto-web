import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  ClipboardList,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Power,
  ShieldCheck,
  ShieldX,
  Trash2,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  activateUserAccount,
  deactivateUserAccount,
  deleteUserAccount,
  fetchPassengerProfile,
  fetchUserProfilePhoto,
  type PassengerProfile,
} from '../api/userApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'
import SuccessModal from '../components/SuccessModal'
import Toast from '../components/Toast'
import UserAvatar from '../components/UserAvatar'
import { maskCpf, maskRg } from '../utils/masks'

type PageStatus = 'loading' | 'loaded' | 'error' | 'notFound'

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
    </div>
  )
}

export default function PassengerDetailPage() {
  const { passengerId } = useParams<{ passengerId: string }>()
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [passenger, setPassenger] = useState<PassengerProfile | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Deletion state
  const [deleting, setDeleting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // Activate/deactivate state
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | undefined>()
  const [successMessage, setSuccessMessage] = useState<string | undefined>()

  const loadPassenger = useCallback(async () => {
    if (!token || !passengerId) return
    setPageStatus('loading')
    setErrorMessage(undefined)

    const result = await fetchPassengerProfile(token, passengerId)
    if (result.ok) {
      setPassenger(result.data)
      setPageStatus('loaded')

      // Use photoUrl from profile if available, otherwise fetch separately
      if (result.data.photoUrl) {
        setPhotoUrl(result.data.photoUrl)
      } else {
        const photoResult = await fetchUserProfilePhoto(token, passengerId)
        if (photoResult.ok) {
          setPhotoUrl(photoResult.data.photoUrl)
        }
      }
    } else if (result.status === 404) {
      setPageStatus('notFound')
    } else {
      setErrorMessage(result.message)
      setPageStatus('error')
    }
  }, [token, passengerId])

  useEffect(() => {
    loadPassenger()
  }, [loadPassenger])

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(undefined), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleDelete = useCallback(async (adminCode: string) => {
    if (!token || !passenger) return
    setDeleteLoading(true)
    setDeleteError(undefined)

    const result = await deleteUserAccount(token, passenger.userId, adminCode)
    setDeleteLoading(false)

    if (result.ok) {
      setDeleting(false)
      setDeleteSuccess(true)
    } else {
      setDeleteError(result.message)
    }
  }, [token, passenger])

  const handleToggleStatus = useCallback(async (adminCode: string) => {
    if (!token || !passenger) return
    setStatusLoading(true)
    setStatusError(undefined)

    const result = passenger.isActive
      ? await deactivateUserAccount(token, passenger.userId, adminCode)
      : await activateUserAccount(token, passenger.userId, adminCode)
    setStatusLoading(false)

    if (result.ok) {
      setStatusModalOpen(false)
      setSuccessMessage(passenger.isActive ? 'Passageiro inativado com sucesso.' : 'Passageiro ativado com sucesso.')
      await loadPassenger()
    } else {
      setStatusError(result.message)
    }
  }, [token, passenger, loadPassenger])

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  if (pageStatus === 'loading') return <DetailSkeleton />

  if (pageStatus === 'notFound') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-800">Passageiro não encontrado</h2>
        <p className="mt-2 text-gray-500">O passageiro solicitado não existe ou foi removido.</p>
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
              onClick={loadPassenger}
              className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!passenger) return null

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
        <UserAvatar photoUrl={photoUrl} fullName={passenger.fullName} size="lg" />
        <h1 className="text-2xl font-bold text-gray-800">{passenger.fullName}</h1>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${passenger.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}
        >
          {passenger.isActive ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : (
            <ShieldX className="h-3.5 w-3.5" />
          )}
          {passenger.isActive ? 'Ativo' : 'Inativo'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {passengerId !== user?.userId && (
            <button
              onClick={() => setStatusModalOpen(true)}
              disabled={statusLoading}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${passenger.isActive
                ? 'border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50'
                : 'border-green-300 bg-white text-green-700 hover:bg-green-50'
                }`}
            >
              <Power className="h-4 w-4" />
              {passenger.isActive ? 'Inativar' : 'Ativar'}
            </button>
          )}
          <Link
            to={`/users/passengers/${passengerId}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          icon={<User className="h-4 w-4 text-blue-500" />}
          label="Nome completo"
          value={passenger.fullName}
        />
        <InfoCard
          icon={<Mail className="h-4 w-4 text-blue-500" />}
          label="E-mail"
          value={passenger.email}
        />
        <InfoCard
          icon={<Hash className="h-4 w-4 text-blue-500" />}
          label="CPF"
          value={maskCpf(passenger.cpf)}
        />
        <InfoCard
          icon={<Hash className="h-4 w-4 text-blue-500" />}
          label="RG"
          value={maskRg(passenger.rg)}
        />
        <InfoCard
          icon={<Hash className="h-4 w-4 text-blue-500" />}
          label="Matrícula"
          value={passenger.registration}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4 text-blue-500" />}
          label="Data de nascimento"
          value={formatDate(passenger.birthdate)}
        />
        <InfoCard
          icon={<Building2 className="h-4 w-4 text-blue-500" />}
          label="Partição pública"
          value={passenger.publicPartitionName}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4 text-blue-500" />}
          label="Data de cadastro"
          value={formatDate(passenger.createdAt)}
        />
        <InfoCard
          icon={<ClipboardList className="h-4 w-4 text-blue-500" />}
          label="Solicitações"
          value={String(passenger.solicitationCount)}
        />
        {passenger.access && (
          <InfoCard
            icon={<ShieldCheck className="h-4 w-4 text-blue-500" />}
            label="Nível de acesso"
            value={passenger.access === 'Admin' ? 'Administrador' : 'Usuário'}
          />
        )}
        {(passenger.city || passenger.state) && (
          <InfoCard
            icon={<MapPin className="h-4 w-4 text-blue-500" />}
            label="Cidade/Estado"
            value={[passenger.city, passenger.state].filter(Boolean).join('/')}
          />
        )}
      </div>

      {/* Departments Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-700">
          <Building2 className="h-5 w-5 text-blue-600" />
          Departamentos
        </h2>
        {passenger.departments.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum departamento associado.</p>
        ) : (
          <ul className="space-y-2">
            {passenger.departments.map((dept) => (
              <li
                key={dept.departmentId}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
              >
                <Building2 className="h-4 w-4 text-gray-400" />
                {dept.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Address Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-700">
          <MapPin className="h-5 w-5 text-blue-600" />
          Endereço
        </h2>
        {passenger.address ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Logradouro
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {passenger.address.lineOne}
              </p>
            </div>
            {passenger.address.lineTwo && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Complemento
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {passenger.address.lineTwo}
                </p>
              </div>
            )}
            {passenger.address.district && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Bairro
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {passenger.address.district}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Cidade/Estado
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {passenger.address.city}/{passenger.address.state}
              </p>
            </div>
            {passenger.address.postalCode && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  CEP
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {passenger.address.postalCode}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                País
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {passenger.address.countryCode}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum endereço cadastrado.</p>
        )}
      </div>

      {/* Danger Zone */}
      {passengerId !== user?.userId && passenger.isActive && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </h2>
          <p className="mb-4 text-sm text-red-600">
            Excluir esta conta é permanente e não pode ser desfeito. O passageiro perderá o acesso
            ao sistema para sempre e não será possível reativar essa conta pela interface.
          </p>
          <button
            onClick={() => setDeleting(true)}
            disabled={deleteLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Excluir conta permanentemente
          </button>
        </div>
      )}

      {successMessage && (
        <Toast message={successMessage} onClose={() => setSuccessMessage(undefined)} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleting}
        title="Excluir conta permanentemente"
        description={`Esta ação não pode ser desfeita. Digite seu código de administrador para excluir a conta de ${passenger.fullName} permanentemente.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(false)
          setDeleteError(undefined)
        }}
        loading={deleteLoading}
        error={deleteError}
      />

      {/* Delete Success Modal */}
      <SuccessModal
        isOpen={deleteSuccess}
        title="Conta excluída"
        description={`A conta de ${passenger.fullName} foi excluída permanentemente. Ela não aparecerá mais na lista de usuários.`}
        buttonLabel="Voltar para Usuários"
        onConfirm={() => navigate('/users')}
      />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        title={passenger.isActive ? 'Inativar conta' : 'Ativar conta'}
        description={
          passenger.isActive
            ? `Digite seu código de administrador para inativar a conta de ${passenger.fullName}. Você pode reativá-la depois.`
            : `Digite seu código de administrador para reativar a conta de ${passenger.fullName}.`
        }
        onConfirm={handleToggleStatus}
        onCancel={() => {
          setStatusModalOpen(false)
          setStatusError(undefined)
        }}
        loading={statusLoading}
        error={statusError}
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
