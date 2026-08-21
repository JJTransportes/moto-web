import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import ConfirmationModal from '../components/ConfirmationModal'
import { changeDriverVehicle, fetchDriverProfile, updateDriver, type DriverProfile } from '../api/userApi'
import { fetchAvailableVehicles, type AvailableVehicle } from '../api/vehicleApi'
import {
  validateFullName,
  validateCpf,
  validateRg,
  validateCnh,
  validateBirthdate,
  validateMaxLength,
  validateRequired,
  validateSafeText,
} from '../utils/validators'
import { maskCpf, maskRg, maskCnh, maskUf, unmaskCpf, unmaskRg } from '../utils/masks'

interface FormValues {
  fullName: string
  cpf: string
  rg: string
  registration: string
  cnh: string
  birthdate: string
  address: string
  city: string
  state: string
}

type FieldErrors = Partial<FormValues>

function toFormValues(d: DriverProfile): FormValues {
  return {
    fullName: d.name,
    cpf: maskCpf(d.cpf ?? ''),
    rg: maskRg(d.rg ?? ''),
    registration: d.registration ?? '',
    cnh: d.cnh ?? '',
    birthdate: (d.birthdate ?? '').slice(0, 10),
    address: d.address?.lineOne ?? '',
    city: d.address?.city ?? d.city ?? '',
    state: d.address?.state ?? d.state ?? '',
  }
}

export default function DriverEditPage() {
  const { token } = useAuth()
  const { driverId } = useParams<{ driverId: string }>()
  const navigate = useNavigate()

  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [form, setForm] = useState<FormValues | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loadError, setLoadError] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()

  // Vehicle switching state
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState<string>()

  const loadDriver = useCallback(async () => {
    if (!token || !driverId) return
    const result = await fetchDriverProfile(token, driverId)
    if (!result.ok) { setLoadError(true); return }
    setDriver(result.data)
    setForm(f => f ?? toFormValues(result.data))
  }, [token, driverId])

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

  const handleSwitchVehicle = async () => {
    if (!token || !driverId || !selectedVehicleId) return
    setSwitching(true)
    setSwitchError(undefined)

    const result = await changeDriverVehicle(token, driverId, selectedVehicleId)
    if (result.ok) {
      setSelectedVehicleId('')
      setSwitchError(undefined)
      await loadDriver()
      await loadAvailableVehicles()
    } else {
      setSwitchError(result.message)
    }
    setSwitching(false)
  }

  const canSwitch = selectedVehicleId && !switching

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">Erro ao carregar motorista. Tente novamente.</p>
          <Link to={`/users/drivers/${driverId}`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Voltar para detalhes
          </Link>
        </div>
      </div>
    )
  }

  if (!form || !driver) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => f ? { ...f, [field]: value } : f)

  function validate(): boolean {
    if (!form) return false
    const e: FieldErrors = {}
    e.fullName = validateFullName(form.fullName) ?? validateMaxLength(form.fullName, 100, 'Nome completo') ?? validateSafeText(form.fullName, 'Nome completo')
    e.cpf = validateCpf(form.cpf)
    e.rg = validateRg(form.rg) ?? validateMaxLength(form.rg, 20, 'RG')
    e.registration = validateRequired(form.registration, 'Matrícula') ?? validateMaxLength(form.registration, 30, 'Matrícula')
    e.cnh = validateRequired(form.cnh, 'CNH') ?? validateCnh(form.cnh)
    e.birthdate = validateBirthdate(form.birthdate)
    e.address = validateRequired(form.address, 'Endereço') ?? validateMaxLength(form.address, 120, 'Endereço') ?? validateSafeText(form.address, 'Endereço')
    e.city = validateRequired(form.city, 'Cidade') ?? validateMaxLength(form.city, 60, 'Cidade') ?? validateSafeText(form.city, 'Cidade')
    e.state = validateRequired(form.state, 'Estado')
    setErrors(e)
    return Object.values(e).every(v => !v)
  }

  const isFormComplete =
    form.fullName.trim() !== '' &&
    form.fullName.length <= 100 &&
    form.cpf.trim() !== '' &&
    form.rg.trim() !== '' &&
    form.rg.length <= 20 &&
    form.registration.trim() !== '' &&
    form.registration.length <= 30 &&
    form.cnh.trim() !== '' &&
    form.birthdate.trim() !== '' &&
    form.address.trim() !== '' &&
    form.address.length <= 120 &&
    form.city.trim() !== '' &&
    form.city.length <= 60 &&
    form.state.trim() !== ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      setModalError(undefined)
      setIsModalOpen(true)
    }
  }

  async function handleConfirm(adminCode: string) {
    if (!token || !form || !driverId) return
    setModalLoading(true)
    setModalError(undefined)

    const result = await updateDriver(token, driverId, {
      fullName: form.fullName,
      cpf: unmaskCpf(form.cpf),
      rg: unmaskRg(form.rg),
      registration: form.registration,
      cnh: form.cnh,
      birthdate: form.birthdate,
      address: {
        lineOne: form.address,
        city: form.city,
        state: form.state,
        countryCode: 'BR',
      },
      adminCode,
    })

    setModalLoading(false)
    if (result.ok) {
      setIsModalOpen(false)
      navigate(`/users/drivers/${driverId}`)
    } else {
      setModalError(result.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link to={`/users/drivers/${driverId}`} className="text-sm text-blue-600 hover:underline">
          ← Voltar para detalhes
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-800">Editar Motorista</h1>
      </div>

      {!driver.address && (
        <div className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Este cadastro é antigo e não tinha endereço vinculado. Preencha o endereço abaixo para salvar as alterações.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="fullName" label="Nome completo" required value={form.fullName} onChange={set('fullName')} error={errors.fullName} placeholder="Nome completo" softMaxLength={100} />
            </div>
            <FormField id="cpf" label="CPF" required value={form.cpf} onChange={set('cpf')} error={errors.cpf} placeholder="000.000.000-00" maxLength={14} mask={maskCpf} />
            <FormField id="rg" label="RG" required value={form.rg} onChange={set('rg')} error={errors.rg} placeholder="00.000.000-0" maxLength={12} mask={maskRg} />
            <FormField id="registration" label="Matrícula" required value={form.registration} onChange={set('registration')} error={errors.registration} placeholder="Matrícula" softMaxLength={30} />
            <FormField id="cnh" label="CNH" required value={form.cnh} onChange={set('cnh')} error={errors.cnh} placeholder="CNH" maxLength={11} mask={maskCnh} digitsOnly />
            <FormField id="birthdate" label="Data de nascimento" required type="date" value={form.birthdate} onChange={set('birthdate')} error={errors.birthdate} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Endereço</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="address" label="Endereço" required value={form.address} onChange={set('address')} error={errors.address} placeholder="Endereço completo" softMaxLength={120} />
            </div>
            <FormField id="city" label="Cidade" required value={form.city} onChange={set('city')} error={errors.city} placeholder="Cidade" softMaxLength={60} />
            <FormField id="state" label="Estado" required value={form.state} onChange={set('state')} error={errors.state} placeholder="UF" maxLength={2} mask={maskUf} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
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
                type="button"
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

        <div className="flex gap-3">
          <Link
            to={`/users/drivers/${driverId}`}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!isFormComplete}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Alterações
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirmar alterações"
        description="Digite seu código de administrador para confirmar as alterações no motorista."
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsModalOpen(false)
          setModalError(undefined)
        }}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  )
}
