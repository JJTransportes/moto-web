import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import ConfirmationModal from '../components/ConfirmationModal'
import { fetchPassengerProfile, updatePassenger, type PassengerProfile } from '../api/userApi'
import { fetchPartitionDepartments, type DepartmentOption } from '../api/publicPartitionApi'
import {
  validateFullName,
  validateCpf,
  validateRg,
  validateBirthdate,
  validateMaxLength,
  validateRequired,
  validateSafeText,
} from '../utils/validators'
import { maskCpf, maskRg, maskUf, unmaskCpf, unmaskRg, validateUf } from '../utils/masks'

interface FormValues {
  fullName: string
  cpf: string
  rg: string
  registration: string
  birthdate: string
  address: string
  city: string
  state: string
  department: string
}

type FieldErrors = Partial<FormValues>

function toFormValues(p: PassengerProfile): FormValues {
  return {
    fullName: p.fullName,
    cpf: maskCpf(p.cpf),
    rg: maskRg(p.rg),
    registration: p.registration,
    birthdate: p.birthdate.slice(0, 10),
    address: p.address?.lineOne ?? '',
    city: p.address?.city ?? p.city ?? '',
    state: p.address?.state ?? p.state ?? '',
    department: p.departments[0]?.departmentId ?? '',
  }
}

function validateForm(form: FormValues): FieldErrors {
  const e: FieldErrors = {}
  e.fullName = validateFullName(form.fullName) ?? validateMaxLength(form.fullName, 100, 'Nome completo') ?? validateSafeText(form.fullName, 'Nome completo')
  e.cpf = validateCpf(form.cpf)
  e.rg = validateRg(form.rg) ?? validateMaxLength(form.rg, 20, 'RG')
  e.registration = validateRequired(form.registration, 'Matrícula') ?? validateMaxLength(form.registration, 30, 'Matrícula')
  e.birthdate = validateBirthdate(form.birthdate)
  e.address = validateRequired(form.address, 'Endereço') ?? validateMaxLength(form.address, 120, 'Endereço') ?? validateSafeText(form.address, 'Endereço')
  e.city = validateRequired(form.city, 'Cidade') ?? validateMaxLength(form.city, 60, 'Cidade') ?? validateSafeText(form.city, 'Cidade')
  e.state = validateUf(form.state)
  return e
}

export default function PassengerEditPage() {
  const { token } = useAuth()
  const { passengerId } = useParams<{ passengerId: string }>()
  const navigate = useNavigate()

  const [passenger, setPassenger] = useState<PassengerProfile | null>(null)
  const [form, setForm] = useState<FormValues | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loadError, setLoadError] = useState(false)
  const [hadMissingFieldsAtLoad, setHadMissingFieldsAtLoad] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()

  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [departmentsError, setDepartmentsError] = useState<string | undefined>()

  useEffect(() => {
    if (!token || !passengerId) return
    fetchPassengerProfile(token, passengerId).then(result => {
      if (!result.ok) { setLoadError(true); return }
      setPassenger(result.data)
      const values = toFormValues(result.data)
      setForm(values)
      const missing = Object.values(validateForm(values)).some(v => !!v)
      setHadMissingFieldsAtLoad(missing)
    })
  }, [token, passengerId])

  // Reactive validation: recompute errors on every relevant change so a field
  // that came empty/invalid from the API is flagged immediately, without
  // requiring a submit attempt first.
  useEffect(() => {
    if (!form) return
    setErrors(validateForm(form))
  }, [form])

  useEffect(() => {
    if (!token || !passenger) return
    setDepartmentsLoading(true)
    setDepartmentsError(undefined)
    fetchPartitionDepartments(token, passenger.publicPartitionId).then(result => {
      setDepartmentsLoading(false)
      if (result.ok) {
        setDepartments(result.data)
      } else {
        setDepartmentsError(result.message)
        setDepartments([])
      }
    })
  }, [token, passenger])

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">Erro ao carregar passageiro. Tente novamente.</p>
          <Link to={`/users/passengers/${passengerId}`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Voltar para detalhes
          </Link>
        </div>
      </div>
    )
  }

  if (!form || !passenger) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => f ? { ...f, [field]: value } : f)

  const isFormValid = Object.values(errors).every(v => !v)

  const missingFieldLabels: Record<keyof FormValues, string> = {
    fullName: 'Nome completo',
    cpf: 'CPF',
    rg: 'RG',
    registration: 'Matrícula',
    birthdate: 'Data de nascimento',
    address: 'Endereço',
    city: 'Cidade',
    state: 'Estado',
    department: 'Departamento',
  }
  const missingFields = (Object.keys(errors) as (keyof FormValues)[])
    .filter(k => !!errors[k])
    .map(k => missingFieldLabels[k])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e2 = form ? validateForm(form) : {}
    setErrors(e2)
    if (Object.values(e2).every(v => !v)) {
      setModalError(undefined)
      setIsModalOpen(true)
    }
  }

  async function handleConfirm(adminCode: string) {
    if (!token || !form || !passengerId) return
    setModalLoading(true)
    setModalError(undefined)

    const result = await updatePassenger(token, passengerId, {
      fullName: form.fullName,
      cpf: unmaskCpf(form.cpf),
      rg: unmaskRg(form.rg),
      registration: form.registration,
      birthdate: form.birthdate,
      address: {
        lineOne: form.address,
        city: form.city,
        state: form.state,
        countryCode: 'BR',
      },
      adminCode,
      departmentIds: form.department ? [form.department] : [],
    })

    setModalLoading(false)
    if (result.ok) {
      setIsModalOpen(false)
      navigate(`/users/passengers/${passengerId}`)
    } else {
      setModalError(result.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link to={`/users/passengers/${passengerId}`} className="text-sm text-blue-600 hover:underline">
          ← Voltar para detalhes
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-800">Editar Passageiro</h1>
      </div>

      {hadMissingFieldsAtLoad && missingFields.length > 0 && (
        <div className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Este cadastro é antigo e tem campos obrigatórios não preenchidos: <strong>{missingFields.join(', ')}</strong>.
          Preencha-os abaixo para poder salvar as alterações.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-medium text-gray-700">Unidade pública</p>
          <p className="mb-4 text-sm text-gray-500">
            {passenger.publicPartitionName} <span className="text-gray-400">(alterar em Unidades Públicas)</span>
          </p>

          {departmentsLoading ? (
            <FormField id="department" label="Departamento" type="select" value="" onChange={() => {}} disabled options={[]} />
          ) : departmentsError ? (
            <p className="text-sm text-red-500" role="alert">{departmentsError}</p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-yellow-600">Nenhum departamento disponível para esta unidade.</p>
          ) : (
            <>
              <FormField
                id="department"
                label="Departamento"
                type="select"
                value={form.department}
                onChange={set('department')}
                options={departments.map(d => ({ value: d.departmentId, label: d.name }))}
              />
              <p className="mt-1 text-xs text-gray-400">Deixe em branco para remover o vínculo com departamento.</p>
            </>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="fullName" label="Nome completo" required value={form.fullName} onChange={set('fullName')} error={errors.fullName} placeholder="Nome completo" softMaxLength={100} />
            </div>
            <FormField id="cpf" label="CPF" required value={form.cpf} onChange={set('cpf')} error={errors.cpf} placeholder="000.000.000-00" maxLength={14} mask={maskCpf} />
            <FormField id="rg" label="RG" required value={form.rg} onChange={set('rg')} error={errors.rg} placeholder="Ex: 123456789 ou MG1234567" maxLength={12} mask={maskRg} />
            <FormField id="registration" label="Matrícula" required value={form.registration} onChange={set('registration')} error={errors.registration} placeholder="Matrícula" softMaxLength={30} />
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

        <div className="flex gap-3">
          <Link
            to={`/users/passengers/${passengerId}`}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!isFormValid}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Alterações
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirmar alterações"
        description="Digite seu código de administrador para confirmar as alterações no passageiro."
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
