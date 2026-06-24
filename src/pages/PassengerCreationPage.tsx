import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import ConfirmationModal from '../components/ConfirmationModal'
import { createPassenger, type CreatePassengerRequest } from '../api/userApi'
import { listPartitions, fetchPartitionDepartments, type PublicPartition, type DepartmentOption } from '../api/publicPartitionApi'
import {
  validateFullName,
  validateCpf,
  validateRg,
  validateBirthdate,
  validateEmail,
  validatePassword,
  validateRequired,
} from '../utils/validators'

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
  publicPartitionId: string
  email: string
  initialPassword: string
}

const emptyForm: FormValues = {
  fullName: '',
  cpf: '',
  rg: '',
  registration: '',
  birthdate: '',
  address: '',
  city: '',
  state: '',
  department: '',
  publicPartitionId: '',
  email: '',
  initialPassword: '',
}

export default function PassengerCreationPage() {
  const { token } = useAuth()
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [errors, setErrors] = useState<Partial<FormValues>>({})
  const [partitions, setPartitions] = useState<PublicPartition[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()
  const [success, setSuccess] = useState(false)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [departmentsError, setDepartmentsError] = useState<string | undefined>()

  useEffect(() => {
    if (token) listPartitions(token).then(r => { if (r.ok) setPartitions(r.data) })
  }, [token])

  useEffect(() => {
    if (!form.publicPartitionId || !token) {
      setDepartments([])
      setForm(f => ({ ...f, department: '' }))
      return
    }

    setDepartmentsLoading(true)
    setDepartmentsError(undefined)

    fetchPartitionDepartments(token, form.publicPartitionId).then(result => {
      setDepartmentsLoading(false)
      if (result.ok) {
        setDepartments(result.data)
      } else {
        setDepartmentsError(result.message)
        setDepartments([])
      }
    })
  }, [form.publicPartitionId, token])

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  function validate(): boolean {
    const e: Partial<FormValues> = {}
    e.fullName = validateFullName(form.fullName)
    e.cpf = validateCpf(form.cpf)
    e.rg = validateRg(form.rg)
    e.registration = validateRequired(form.registration, 'Matrícula')
    e.birthdate = validateBirthdate(form.birthdate)
    e.address = validateRequired(form.address, 'Endereço')
    e.city = validateRequired(form.city, 'Cidade')
    e.state = validateRequired(form.state, 'Estado')
    e.department = validateRequired(form.department, 'Departamento')
    e.publicPartitionId = validateRequired(form.publicPartitionId, 'Unidade')
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

    const req: CreatePassengerRequest = {
      fullName: form.fullName,
      cpf: form.cpf,
      rg: form.rg,
      registration: form.registration,
      birthdate: form.birthdate,
      address: {
        lineOne: form.address,
        city: form.city,
        state: form.state,
        countryCode: 'BR',
      },
      department: form.department,
      publicPartitionId: form.publicPartitionId,
      email: form.email,
      initialPassword: form.initialPassword,
      adminCode,
    }

    const result = await createPassenger(token, req)
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
          <p className="text-lg font-semibold text-green-700">Passageiro criado com sucesso!</p>
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
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Novo Passageiro</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-medium text-gray-700">Tipo de usuário</p>
          <p className="text-sm text-gray-500">Passageiro</p>
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
            <FormField id="birthdate" label="Data de nascimento" type="date" value={form.birthdate} onChange={set('birthdate')} error={errors.birthdate} placeholder="" />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Endereço</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="address" label="Endereço" value={form.address} onChange={set('address')} error={errors.address} placeholder="Endereço completo" />
            </div>
            <FormField id="city" label="Cidade" value={form.city} onChange={set('city')} error={errors.city} placeholder="Cidade" />
            <FormField id="state" label="Estado" value={form.state} onChange={set('state')} error={errors.state} placeholder="Estado" />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Unidade e departamento</h2>
          <div className="flex flex-col gap-4">
            <FormField
              id="publicPartitionId"
              label="Unidade pública"
              type="select"
              value={form.publicPartitionId}
              onChange={set('publicPartitionId')}
              error={errors.publicPartitionId}
              options={partitions.map(p => ({ value: p.partitionId, label: p.name }))}
            />

            {form.publicPartitionId ? (
              departmentsLoading ? (
                <FormField
                  id="department"
                  label="Departamento"
                  type="select"
                  value=""
                  onChange={() => {}}
                  disabled
                  options={[]}
                />
              ) : departmentsError ? (
                <p className="text-sm text-red-500" role="alert">{departmentsError}</p>
              ) : departments.length === 0 ? (
                <p className="text-sm text-yellow-600">Nenhum departamento disponível para esta unidade.</p>
              ) : (
                <FormField
                  id="department"
                  label="Departamento"
                  type="select"
                  value={form.department}
                  onChange={set('department')}
                  error={errors.department}
                  options={departments.map(d => ({ value: d.departmentId, label: d.name }))}
                />
              )
            ) : (
              <FormField
                id="department"
                label="Departamento"
                type="select"
                value=""
                onChange={() => {}}
                disabled
                options={[]}
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
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Criar Passageiro
        </button>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirmar criação de passageiro"
        description="Digite seu código de administrador para confirmar a criação do passageiro."
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
