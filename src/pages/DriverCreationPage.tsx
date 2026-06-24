import { useEffect, useState } from 'react'
import { createDriver, type CreateDriverRequest } from '../api/userApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'
import FormField from '../components/FormField'
import { fetchAvailableVehicles, type AvailableVehicle } from '../api/vehicleApi'
import {
  validateBirthdate,
  validateCpf,
  validateEmail,
  validateFullName,
  validatePassword,
  validateRequired,
  validateRg
} from '../utils/validators'

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
  department: string
  vehicleId: string
  email: string
  initialPassword: string
}

const emptyForm: FormValues = {
  fullName: '',
  cpf: '',
  rg: '',
  registration: '',
  cnh: '',
  birthdate: '',
  address: '',
  city: '',
  state: '',
  department: '',
  vehicleId: '',
  email: '',
  initialPassword: '',
}

interface FormErrors {
  fullName?: string
  cpf?: string
  rg?: string
  registration?: string
  cnh?: string
  birthdate?: string
  address?: string
  city?: string
  state?: string
  department?: string
  vehicleId?: string
  email?: string
  initialPassword?: string
}

export default function DriverCreationPage() {
  const { token } = useAuth()
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) return
    setVehiclesLoading(true)
    fetchAvailableVehicles(token).then(r => {
      setVehiclesLoading(false)
      if (r.ok) setVehicles(r.data)
    })
  }, [token])

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  function validate(): boolean {
    const e: FormErrors = {}
    e.fullName = validateFullName(form.fullName)
    e.cpf = validateCpf(form.cpf)
    e.rg = validateRg(form.rg)
    e.registration = validateRequired(form.registration, 'Matrícula')
    e.cnh = validateRequired(form.cnh, 'CNH')
    e.birthdate = validateBirthdate(form.birthdate)
    e.address = validateRequired(form.address, 'Endereço')
    e.city = validateRequired(form.city, 'Cidade')
    e.state = validateRequired(form.state, 'Estado')
    e.department = validateRequired(form.department, 'Departamento')
    e.vehicleId = validateRequired(form.vehicleId, 'Veículo')
    e.email = validateEmail(form.email)
    e.initialPassword = validatePassword(form.initialPassword)
    setErrors(e)
    return Object.values(e).every(v => !v)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) setIsModalOpen(true)
  }

  async function handleConfirm(adminCode: string) {
    if (!token) return
    setModalLoading(true)
    setModalError(undefined)

    const req: CreateDriverRequest = {
      fullName: form.fullName,
      cpf: form.cpf,
      rg: form.rg,
      registration: form.registration,
      cnh: form.cnh,
      birthdate: form.birthdate,
      address: {
        lineOne: form.address,
        city: form.city,
        state: form.state,
        countryCode: 'BR',
      },
      department: form.department,
      vehicleId: form.vehicleId,
      email: form.email,
      initialPassword: form.initialPassword,
      adminCode,
    }

    const result = await createDriver(token, req)
    setModalLoading(false)

    if (result.ok) {
      setIsModalOpen(false)
      setSuccess(true)
      setForm(emptyForm)
      setErrors({})
    } else {
      setModalError(result.message)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-xl bg-green-50 p-8 text-center">
          <p className="text-lg font-semibold text-green-700">Motorista criado com sucesso!</p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Criar outro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Novo Motorista</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-medium text-gray-700">Tipo de usuário</p>
          <p className="text-sm text-gray-500">Motorista</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="fullName" label="Nome completo" value={form.fullName} onChange={set('fullName')} error={errors.fullName} placeholder="Nome completo" />
            </div>
            <FormField id="cpf" label="CPF" value={form.cpf} onChange={set('cpf')} error={errors.cpf} placeholder="000.000.000-00" />
            <FormField id="rg" label="RG" value={form.rg} onChange={set('rg')} error={errors.rg} placeholder="RG" />
            <FormField id="registration" label="Matrícula" value={form.registration} onChange={set('registration')} error={errors.registration} placeholder="Matrícula" />
            <FormField id="cnh" label="CNH" value={form.cnh} onChange={set('cnh')} error={errors.cnh} placeholder="CNH" />
            <FormField id="birthdate" label="Data de nascimento" type="date" value={form.birthdate} onChange={set('birthdate')} error={errors.birthdate} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Endereço e departamento</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="address" label="Endereço" value={form.address} onChange={set('address')} error={errors.address} placeholder="Endereço completo" />
            </div>
            <FormField id="city" label="Cidade" value={form.city} onChange={set('city')} error={errors.city} placeholder="Cidade" />
            <FormField id="state" label="Estado" value={form.state} onChange={set('state')} error={errors.state} placeholder="Estado" />
            <div className="col-span-2">
              <FormField id="department" label="Departamento" value={form.department} onChange={set('department')} error={errors.department} placeholder="Departamento" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Veículo</h2>
          <div className="grid grid-cols-1 gap-4">
            {vehiclesLoading ? (
              <p className="text-sm text-gray-400">Carregando veículos...</p>
            ) : vehicles.length === 0 ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-700">
                  Nenhum veículo disponível. Cadastre um veículo antes de criar um motorista.
                </p>
              </div>
            ) : (
              <FormField
                id="vehicleId"
                label="Selecione o veículo"
                type="select"
                value={form.vehicleId}
                onChange={set('vehicleId')}
                error={errors.vehicleId}
                options={vehicles.map(v => ({
                  value: v.vehicleId,
                  label: `${v.brand} ${v.model} - ${v.plate}${v.categoryTitle ? ` (${v.categoryTitle})` : ''}`
                }))}
              />
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Credenciais de acesso</h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField id="email" label="E-mail" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="email@exemplo.com" />
            <FormField id="initialPassword" label="Senha inicial" type="password" value={form.initialPassword} onChange={set('initialPassword')} error={errors.initialPassword} placeholder="Senha inicial" />
          </div>
        </div>

        <button
          type="submit"
          disabled={vehicles.length === 0}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Criar Motorista
        </button>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirmar criação de motorista"
        description="Digite seu código de administrador para confirmar a criação do motorista."
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
