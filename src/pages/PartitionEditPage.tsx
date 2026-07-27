import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listCategories, type CategorySummary } from '../api/categoryApi'
import { deletePartition, getPartition, updatePartition, type PublicPartitionDetail } from '../api/publicPartitionApi'
import { useAuth } from '../auth/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'
import FormField from '../components/FormField'
import { validateRequired } from '../utils/validators'

interface FormValues {
  name: string
  identifier: string
  acronym: string
  departments: string
  lineOne: string
  lineTwo: string
  district: string
  city: string
  state: string
  postalCode: string
  countryCode: string
}

type FieldErrors = Partial<FormValues>

function toFormValues(p: PublicPartitionDetail): FormValues {
  return {
    name: p.name,
    identifier: p.identifier,
    acronym: p.acronym,
    departments: p.departments,
    lineOne: p.address.lineOne,
    lineTwo: p.address.lineTwo ?? '',
    district: p.address.district ?? '',
    city: p.address.city,
    state: p.address.state,
    postalCode: p.address.postalCode ?? '',
    countryCode: p.address.countryCode,
  }
}

export default function PartitionEditPage() {
  const { token, hasMinimumRole } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const { partitionId } = useParams<{ partitionId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormValues | null>(null)
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

  function validate(): boolean {
    if (!form) return false
    const e: FieldErrors = {}
    e.name = validateRequired(form.name, 'Nome')
    e.identifier = validateRequired(form.identifier, 'Identificador')
    e.acronym = validateRequired(form.acronym, 'Sigla')
    e.departments = validateRequired(form.departments, 'Departamentos')
    e.lineOne = validateRequired(form.lineOne, 'Logradouro')
    e.city = validateRequired(form.city, 'Cidade')
    e.state = validateRequired(form.state, 'Estado')
    e.countryCode = validateRequired(form.countryCode, 'País')
    setErrors(e)
    return Object.values(e).every(v => !v)
  }

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
      departments: form.departments.split(',').map(d => d.trim()).filter(Boolean),
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
              <FormField id="name" label="Nome" value={form.name} onChange={set('name')} error={errors.name} placeholder="Nome da unidade" />
            </div>
            <FormField id="identifier" label="Identificador" value={form.identifier} onChange={set('identifier')} error={errors.identifier} placeholder="Ex: SMTT" />
            <FormField id="acronym" label="Sigla" value={form.acronym} onChange={set('acronym')} error={errors.acronym} placeholder="Ex: SMTT" />
            <div className="col-span-2">
              <FormField id="departments" label="Departamentos" value={form.departments} onChange={set('departments')} error={errors.departments} placeholder="Adicione um novo departamento" />
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
              <FormField id="lineOne" label="Logradouro" value={form.lineOne} onChange={set('lineOne')} error={errors.lineOne} placeholder="Rua, número" />
            </div>
            <div className="col-span-2">
              <FormField id="lineTwo" label="Complemento (opcional)" value={form.lineTwo} onChange={set('lineTwo')} placeholder="Apto, sala..." />
            </div>
            <FormField id="district" label="Bairro (opcional)" value={form.district} onChange={set('district')} placeholder="Bairro" />
            <FormField id="city" label="Cidade" value={form.city} onChange={set('city')} error={errors.city} placeholder="Cidade" />
            <FormField id="state" label="Estado" value={form.state} onChange={set('state')} error={errors.state} placeholder="UF" />
            <FormField id="postalCode" label="CEP (opcional)" value={form.postalCode} onChange={set('postalCode')} placeholder="00000-000" />
            <FormField id="countryCode" label="País" value={form.countryCode} onChange={set('countryCode')} error={errors.countryCode} placeholder="BR" />
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
            disabled={saveLoading}
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
