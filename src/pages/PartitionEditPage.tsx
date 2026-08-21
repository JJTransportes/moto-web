import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listCategories, type CategorySummary } from '../api/categoryApi'
import { deletePartition, getPartition, updatePartition, type PublicPartitionDetail } from '../api/publicPartitionApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'
import FormField from '../components/FormField'
import { validateMaxLength, validateRequired, validateSafeText } from '../utils/validators'
import { maskCep, maskCountryCode, maskUf } from '../utils/masks'

interface FormValues {
  name: string
  identifier: string
  acronym: string
  lineOne: string
  lineTwo: string
  district: string
  city: string
  state: string
  postalCode: string
  countryCode: string
}

type FieldErrors = Partial<FormValues> & { departments?: string; categoryIds?: string }

function toFormValues(p: PublicPartitionDetail): FormValues {
  return {
    name: p.name,
    identifier: p.identifier,
    acronym: p.acronym,
    lineOne: p.address.lineOne,
    lineTwo: p.address.lineTwo ?? '',
    district: p.address.district ?? '',
    city: p.address.city,
    state: p.address.state,
    postalCode: p.address.postalCode ?? '',
    countryCode: p.address.countryCode,
  }
}

function toDepartmentList(departments: string): string[] {
  return departments.split(',').map(d => d.trim()).filter(Boolean)
}

export default function PartitionEditPage() {
  const { token, hasMinimumRole } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const { partitionId } = useParams<{ partitionId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormValues | null>(null)
  const [departmentInput, setDepartmentInput] = useState('')
  const [departmentList, setDepartmentList] = useState<string[]>([])
  const [currentCategoryIds, setCurrentCategoryIds] = useState<string[]>([])
  const [currentCategoryTitles, setCurrentCategoryTitles] = useState<string[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loadError, setLoadError] = useState(false)
  const [serverError, _] = useState<string | undefined>()

  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()

  useEffect(() => {
    if (!token || !partitionId) return
    getPartition(token, partitionId).then(result => {
      if (!result.ok) { setLoadError(true); return }
      setForm(toFormValues(result.data))
      setDepartmentList(toDepartmentList(result.data.departments))
      setCurrentCategoryIds(result.data.categoryIds)
      setCurrentCategoryTitles(result.data.categoryTitles)
      setSelectedCategoryIds(result.data.categoryIds)
    })
  }, [token, partitionId])

  useEffect(() => {
    if (!token) return
    setCategoriesLoading(true)
    listCategories(token).then(result => {
      setCategoriesLoading(false)
      if (result.ok) {
        setCategories(result.data)
      }
    })
  }, [token])

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">Erro ao carregar unidade. Tente novamente.</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => f ? { ...f, [field]: value } : f)

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
    if (!form) return false
    const e: FieldErrors = {}
    e.name = validateRequired(form.name, 'Nome') ?? validateMaxLength(form.name, 100, 'Nome') ?? validateSafeText(form.name, 'Nome')
    e.identifier = validateRequired(form.identifier, 'Identificador') ?? validateMaxLength(form.identifier, 30, 'Identificador') ?? validateSafeText(form.identifier, 'Identificador')
    e.acronym = validateRequired(form.acronym, 'Sigla') ?? validateMaxLength(form.acronym, 10, 'Sigla') ?? validateSafeText(form.acronym, 'Sigla')
    if (departmentList.length === 0) {
      e.departments = 'Adicione pelo menos uma secretaria.'
    }
    if (isGlobalAdmin && selectedCategoryIds.length === 0) {
      e.categoryIds = 'Selecione pelo menos uma categoria.'
    }
    e.lineOne = validateRequired(form.lineOne, 'Logradouro') ?? validateMaxLength(form.lineOne, 120, 'Logradouro') ?? validateSafeText(form.lineOne, 'Logradouro')
    e.lineTwo = validateMaxLength(form.lineTwo, 60, 'Complemento') ?? validateSafeText(form.lineTwo, 'Complemento')
    e.district = validateMaxLength(form.district, 60, 'Bairro') ?? validateSafeText(form.district, 'Bairro')
    e.city = validateRequired(form.city, 'Cidade') ?? validateMaxLength(form.city, 60, 'Cidade') ?? validateSafeText(form.city, 'Cidade')
    e.state = validateRequired(form.state, 'Estado')
    e.countryCode = validateRequired(form.countryCode, 'País')
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
    departmentList.length > 0 &&
    (!isGlobalAdmin || selectedCategoryIds.length > 0) &&
    form.lineOne.trim() !== '' &&
    form.lineOne.length <= 120 &&
    form.lineTwo.length <= 60 &&
    form.district.length <= 60 &&
    form.city.trim() !== '' &&
    form.city.length <= 60 &&
    form.state.trim() !== '' &&
    form.countryCode.trim() !== ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      setSaveError(undefined)
      setSaveModalOpen(true)
    }
  }

  async function handleSaveConfirm(adminCode: string) {
    if (!token || !form || !partitionId) return
    setSaveLoading(true)
    setSaveError(undefined)

    const categoryIds = isGlobalAdmin ? selectedCategoryIds : currentCategoryIds

    const result = await updatePartition(token, partitionId, {
      name: form.name,
      identifier: form.identifier,
      acronym: form.acronym,
      departments: departmentList,
      categoryIds,
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

    setSaveLoading(false)
    if (result.ok) {
      setSaveModalOpen(false)
      navigate(`/partitions/${partitionId}`)
    } else {
      setSaveError(result.message)
    }
  }

  async function handleDelete(adminCode: string) {
    if (!token || !partitionId) return
    setDeleteLoading(true)
    setDeleteError(undefined)
    const result = await deletePartition(token, partitionId)
    setDeleteLoading(false)
    if (result.ok) {
      navigate('/partitions')
    } else {
      setDeleteError(result.message)
    }
    void adminCode
  }

  function toggleCategory(categoryId: string) {
    if (!isGlobalAdmin) return
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Editar Unidade Pública</h1>
        {isGlobalAdmin && (
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Excluir
          </button>
        )}
      </div>

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

            {/* Categorias field */}
            <div className="col-span-2">
              {isGlobalAdmin ? (
                <>
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Categorias atuais:</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {currentCategoryTitles.length > 0 ? currentCategoryTitles.join(', ') : '—'}
                    </span>
                  </div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Alterar categorias</label>
                  {categoriesLoading ? (
                    <p className="text-sm text-gray-400">Carregando categorias...</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhuma categoria disponível.</p>
                  ) : (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-300 p-3">
                      {categories.map(c => {
                        const checked = selectedCategoryIds.includes(c.categoryId)
                        return (
                          <label key={c.categoryId} className="flex items-center gap-2 cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(c.categoryId)}
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
                </>
              ) : (
                <div>
                  <span className="text-sm font-medium text-gray-700">Categorias:</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {currentCategoryTitles.length > 0 ? currentCategoryTitles.join(', ') : '—'}
                  </span>
                </div>
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

        {serverError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/partitions/${partitionId}`)}
            disabled={saveLoading}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saveLoading || !isFormComplete}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Salvar Alterações
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={saveModalOpen}
        title="Confirmar alterações"
        description="Digite seu código de administrador para confirmar as alterações na unidade."
        onConfirm={handleSaveConfirm}
        onCancel={() => {
          setSaveModalOpen(false)
          setSaveError(undefined)
        }}
        loading={saveLoading}
        error={saveError}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Excluir unidade"
        description="Esta ação não pode ser desfeita. Digite seu código de administrador para confirmar."
        onConfirm={handleDelete}
        onCancel={() => { setDeleteModalOpen(false); setDeleteError(undefined) }}
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  )
}
