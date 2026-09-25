import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listCategories, type CategorySummary } from '../api/categoryApi'
import { fetchVehicle, updateVehicle, type Vehicle } from '../api/vehicleApi'
import FormField from '../components/FormField'
import { validateMaxLength, validateRequired, validateSafeText } from '../utils/validators'
import { maskPlate, validatePlate } from '../utils/masks'

interface FormValues {
  brand: string
  model: string
  year: string
  plate: string
  categoryId: string
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

function toFormValues(v: Vehicle): FormValues {
  return {
    brand: v.brand,
    model: v.model,
    year: v.year.toString(),
    plate: v.plate,
    categoryId: v.categoryId,
  }
}

export default function FleetEditPage() {
  const { token } = useAuth()
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormValues | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loadError, setLoadError] = useState(false)

  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()

  useEffect(() => {
    if (!token || !vehicleId) return
    fetchVehicle(token, vehicleId).then(result => {
      if (!result.ok) { setLoadError(true); return }
      setForm(toFormValues(result.data))
    })
  }, [token, vehicleId])

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
          <p className="text-red-600">Erro ao carregar veículo. Tente novamente.</p>
          <Link to="/fleets" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Voltar para a lista
          </Link>
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

  // WEB-13: `validate()` e o antigo `isFormComplete` reimplementavam as
  // mesmas regras em dois lugares e podiam divergir silenciosamente.
  // `computeErrors()` é a única fonte de verdade agora.
  function computeErrors(values: FormValues): FieldErrors {
    const e: FieldErrors = {}
    e.brand = validateRequired(values.brand, 'Marca') ?? validateMaxLength(values.brand, 20, 'Marca') ?? validateSafeText(values.brand, 'Marca')
    e.model = validateRequired(values.model, 'Modelo') ?? validateMaxLength(values.model, 20, 'Modelo') ?? validateSafeText(values.model, 'Modelo')
    if (!values.year.trim()) {
      e.year = 'Ano é obrigatório.'
    } else {
      const y = Number(values.year)
      if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 1) {
        e.year = 'Ano inválido.'
      }
    }
    e.plate = validatePlate(values.plate)
    e.categoryId = validateRequired(values.categoryId, 'Categoria')
    return e
  }

  function validate(): boolean {
    if (!form) return false
    const e = computeErrors(form)
    setErrors(e)
    return Object.values(e).every(v => !v)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !token || !vehicleId) return
    setSubmitting(true)
    setSubmitError(undefined)

    const result = await updateVehicle(token, vehicleId, {
      brand: form!.brand.trim(),
      model: form!.model.trim(),
      year: Number(form!.year),
      plate: form!.plate.trim(),
      categoryId: form!.categoryId,
    })

    setSubmitting(false)
    if (result.ok) {
      navigate(`/fleets/${vehicleId}`)
    } else {
      setSubmitError(result.message)
    }
  }

  const categoryOptions = categories.map(c => ({
    value: c.categoryId,
    label: c.title,
  }))

  const isFormComplete = Object.values(computeErrors(form)).every(v => !v)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link to={`/fleets/${vehicleId}`} className="text-sm text-blue-600 hover:underline">
          ← Voltar para detalhes
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-800">Editar Veículo</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Informações do veículo</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="brand"
              label="Marca"
              required
              value={form.brand}
              onChange={set('brand')}
              error={errors.brand}
              placeholder="Ex: Toyota"
              softMaxLength={20}
            />
            <FormField
              id="model"
              label="Modelo"
              required
              value={form.model}
              onChange={set('model')}
              error={errors.model}
              placeholder="Ex: Corolla"
              softMaxLength={20}
            />
            <FormField
              id="year"
              label="Ano"
              required
              value={form.year}
              onChange={set('year')}
              error={errors.year}
              placeholder="Ex: 2024"
              maxLength={4}
              digitsOnly
            />
            <FormField
              id="plate"
              label="Placa"
              required
              value={form.plate}
              onChange={set('plate')}
              error={errors.plate}
              placeholder="Ex: ABC1D23"
              maxLength={7}
              mask={maskPlate}
            />
            <div className="col-span-2">
              <FormField
                id="categoryId"
                type="select"
                label="Categoria"
                required
                value={form.categoryId}
                onChange={set('categoryId')}
                error={errors.categoryId}
                disabled={categoriesLoading}
                options={categoriesLoading ? [{ value: '', label: 'Carregando...' }] : categoryOptions}
              />
            </div>
          </div>
        </div>

        {submitError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {submitError}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to={`/fleets/${vehicleId}`}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || !isFormComplete}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
