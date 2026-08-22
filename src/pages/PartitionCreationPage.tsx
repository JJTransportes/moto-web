import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCategories, type CategorySummary } from '../api/categoryApi'
import { createPartition } from '../api/publicPartitionApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'
import FormField from '../components/FormField'
import { validateMaxLength, validateRequired, validateSafeText } from '../utils/validators'
import { maskCep, maskCountryCode, maskUf, validateUf } from '../utils/masks'

interface FormValues {
  name: string
  identifier: string
  acronym: string
  categoryIds: string[]
  lineOne: string
  lineTwo: string
  district: string
  city: string
  state: string
  postalCode: string
  countryCode: string
}

const emptyForm: FormValues = {
  name: '',
  identifier: '',
  acronym: '',
  categoryIds: [],
  lineOne: '',
  lineTwo: '',
  district: '',
  city: '',
  state: '',
  postalCode: '',
  countryCode: 'BR',
}

type FieldErrors = Partial<Omit<FormValues, 'categoryIds'> & { departments: string; categoryIds: string }>

export default function PartitionCreationPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [departmentInput, setDepartmentInput] = useState('')
  const [departmentList, setDepartmentList] = useState<string[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()

  useEffect(() => {
    if (!token) return
    setCategoriesLoading(true)
    setCategoriesError(false)
    listCategories(token).then(result => {
      setCategoriesLoading(false)
      if (result.ok) {
        setCategories(result.data)
      } else {
        setCategoriesError(true)
      }
    })
  }, [token])

  const set = (field: Exclude<keyof FormValues, 'categoryIds'>) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const isAddDepartmentEnabled =
    form.name.trim() !== '' &&
    form.name.length <= 100 &&
    form.identifier.trim() !== '' &&
    form.identifier.length <= 30 &&
    form.acronym.trim() !== '' &&
    form.acronym.length <= 10 &&
    departmentInput.trim() !== '' &&
    departmentInput.length <= 100

  function handleAddDepartment() {
    if (!isAddDepartmentEnabled) return
    const trimmed = departmentInput.trim()
    if (!trimmed) return
    if (validateSafeText(trimmed, 'Departamento')) {
      setErrors(e => ({ ...e, departments: validateSafeText(trimmed, 'Departamento') }))
      return
    }
    if (departmentList.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setErrors(e => ({ ...e, departments: 'Secretaria já adicionada.' }))
      return
    }
    setDepartmentList([...departmentList, trimmed])
    setDepartmentInput('')
    setErrors(e => ({ ...e, departments: undefined }))
  }

  function handleRemoveDepartment(index: number) {
    setDepartmentList(departmentList.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const e: FieldErrors = {}
    e.name = validateRequired(form.name, 'Nome') ?? validateMaxLength(form.name, 100, 'Nome') ?? validateSafeText(form.name, 'Nome')
    e.identifier = validateRequired(form.identifier, 'Identificador') ?? validateMaxLength(form.identifier, 30, 'Identificador') ?? validateSafeText(form.identifier, 'Identificador')
    e.acronym = validateRequired(form.acronym, 'Sigla') ?? validateMaxLength(form.acronym, 10, 'Sigla') ?? validateSafeText(form.acronym, 'Sigla')
    if (form.categoryIds.length === 0) {
      e.categoryIds = 'Selecione pelo menos uma categoria.'
    }
    e.lineOne = validateRequired(form.lineOne, 'Logradouro') ?? validateMaxLength(form.lineOne, 120, 'Logradouro') ?? validateSafeText(form.lineOne, 'Logradouro')
    e.lineTwo = validateMaxLength(form.lineTwo, 60, 'Complemento') ?? validateSafeText(form.lineTwo, 'Complemento')
    e.district = validateMaxLength(form.district, 60, 'Bairro') ?? validateSafeText(form.district, 'Bairro')
    e.city = validateRequired(form.city, 'Cidade') ?? validateMaxLength(form.city, 60, 'Cidade') ?? validateSafeText(form.city, 'Cidade')
    e.state = validateUf(form.state)
    e.countryCode = validateRequired(form.countryCode, 'País')
    if (departmentList.length === 0) {
      e.departments = 'Adicione pelo menos uma secretaria.'
    }
    setErrors(e)
    return Object.values(e).every(v => !v)
  }

  const isFormComplete =
    form.name.trim() !== '' &&
    form.name.length <= 100 &&
    form.identifier.trim() !== '' &&
    form.identifier.length <= 30 &&
    form.acronym.trim() !== '' &&
    form.acronym.length <= 10 &&
    form.categoryIds.length > 0 &&
    form.lineOne.trim() !== '' &&
    form.lineOne.length <= 120 &&
    form.lineTwo.length <= 60 &&
    form.district.length <= 60 &&
    form.city.trim() !== '' &&
    form.city.length <= 60 &&
    form.state.trim() !== '' &&
    form.countryCode.trim() !== '' &&
    departmentList.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) setIsModalOpen(true)
  }

  async function handleConfirm(adminCode: string) {
    if (!token) return
    setModalLoading(true)
    setModalError(undefined)

    const result = await createPartition(token, {
      name: form.name,
      identifier: form.identifier,
      acronym: form.acronym,
      departments: departmentList,
      categoryIds: form.categoryIds,
      adminCode,
      address: {
        lineOne: form.lineOne,
        lineTwo: form.lineTwo.trim() || null,
        district: form.district.trim() || null,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode.trim() || null,
        countryCode: form.countryCode,
      },
    })

    setModalLoading(false)
    if (result.ok) {
      setIsModalOpen(false)
      navigate(`/partitions/${result.data.partitionId}`)
    } else {
      setModalError(result.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Nova Unidade Pública</h1>

      {categoriesError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          Não foi possível carregar as categorias disponíveis. Tente novamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Informações gerais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="name" label="Nome" required value={form.name} onChange={set('name')} error={errors.name} placeholder="Nome da unidade" softMaxLength={100} />
            </div>
            <FormField id="identifier" label="Identificador" required value={form.identifier} onChange={set('identifier')} error={errors.identifier} placeholder="Ex: SMTT" softMaxLength={30} />
            <FormField id="acronym" label="Sigla" required value={form.acronym} onChange={set('acronym')} error={errors.acronym} placeholder="Ex: SMTT" softMaxLength={10} />
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Departamentos<span className="text-red-500" aria-hidden="true"> *</span></label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={departmentInput}
                  onChange={e => setDepartmentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDepartment() } }}
                  placeholder="Nome do departamento"
                  maxLength={100}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  disabled={!isAddDepartmentEnabled}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              </div>
              {errors.departments && (
                <p className="mt-1 text-sm text-red-500">{errors.departments}</p>
              )}
              {departmentList.length > 0 && (
                <ul className="mt-2 max-h-[170px] space-y-1 overflow-y-auto">
                  {departmentList.map((dept, i) => (
                    <li key={i} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                      <span>{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDepartment(i)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        aria-label={`Remover ${dept}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Categorias<span className="text-red-500" aria-hidden="true"> *</span></label>
              {categoriesLoading ? (
                <p className="text-sm text-gray-400">Carregando categorias...</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma categoria disponível.</p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-300 p-3">
                  {categories.map(c => {
                    const checked = form.categoryIds.includes(c.categoryId)
                    return (
                      <label key={c.categoryId} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setForm(f => ({ ...f, categoryIds: f.categoryIds.filter(id => id !== c.categoryId) }))
                            } else {
                              setForm(f => ({ ...f, categoryIds: [...f.categoryIds, c.categoryId] }))
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{c.title}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {errors.categoryIds && (
                <p className="mt-1 text-xs text-red-500" role="alert">{errors.categoryIds}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Endereço</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField id="lineOne" label="Logradouro" required value={form.lineOne} onChange={set('lineOne')} error={errors.lineOne} placeholder="Rua, número" softMaxLength={120} />
            </div>
            <div className="col-span-2">
              <FormField id="lineTwo" label="Complemento (opcional)" value={form.lineTwo} onChange={set('lineTwo')} error={errors.lineTwo} placeholder="Apto, sala..." softMaxLength={60} />
            </div>
            <FormField id="district" label="Bairro (opcional)" value={form.district} onChange={set('district')} error={errors.district} placeholder="Bairro" softMaxLength={60} />
            <FormField id="city" label="Cidade" required value={form.city} onChange={set('city')} error={errors.city} placeholder="Cidade" softMaxLength={60} />
            <FormField id="state" label="Estado" required value={form.state} onChange={set('state')} error={errors.state} placeholder="UF" maxLength={2} mask={maskUf} />
            <FormField id="postalCode" label="CEP (opcional)" value={form.postalCode} onChange={set('postalCode')} placeholder="00000-000" maxLength={9} mask={maskCep} />
            <FormField id="countryCode" label="País" required value={form.countryCode} onChange={set('countryCode')} error={errors.countryCode} placeholder="BR" maxLength={2} mask={maskCountryCode} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/partitions')}
            disabled={modalLoading}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={categoriesError || !isFormComplete}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Criar Unidade
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirmar criação de unidade"
        description="Digite seu código de administrador para confirmar a criação da unidade."
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
