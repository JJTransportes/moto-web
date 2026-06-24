import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listCategories, type CategorySummary } from '../api/categoryApi'
import { createVehicle } from '../api/vehicleApi'
import FormField from '../components/FormField'
import { validateRequired } from '../utils/validators'

interface FormValues {
  brand: string
  model: string
  year: string
  plate: string
  categoryId: string
}

const emptyForm: FormValues = {
  brand: '',
  model: '',
  year: '',
  plate: '',
  categoryId: '',
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

export default function FleetCreationPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()

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

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  function validate(): boolean {
    const e: FieldErrors = {}
    e.brand = validateRequired(form.brand, 'Marca')
    e.model = validateRequired(form.model, 'Modelo')
    if (!form.year.trim()) {
      e.year = 'Ano é obrigatório.'
    } else {
      const y = Number(form.year)
      if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 1) {
        e.year = 'Ano inválido.'
      }
    }
    e.plate = validateRequired(form.plate, 'Placa')
    e.categoryId = validateRequired(form.categoryId, 'Categoria')
    setErrors(e)
    return Object.values(e).every(v => !v)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !token) return
    setSubmitting(true)
    setSubmitError(undefined)

    const result = await createVehicle(token, {
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      plate: form.plate.trim(),
      categoryId: form.categoryId,
    })

    setSubmitting(false)
    if (result.ok) {
      navigate(`/fleets/${result.data.vehicleId}`)
    } else {
      setSubmitError(result.message)
    }
  }

  const categoryOptions = categories.map(c => ({
    value: c.categoryId,
    label: c.title,
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link to="/fleets" className="text-sm text-blue-600 hover:underline">
          ← Frotas
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-800">Novo Veículo</h1>
      </div>

      {categoriesError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          Não foi possível carregar as categorias disponíveis. Tente novamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Informações do veículo</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="brand"
              label="Marca"
              value={form.brand}
              onChange={set('brand')}
              error={errors.brand}
              placeholder="Ex: Toyota"
            />
            <FormField
              id="model"
              label="Modelo"
              value={form.model}
              onChange={set('model')}
              error={errors.model}
              placeholder="Ex: Corolla"
            />
            <FormField
              id="year"
              label="Ano"
              value={form.year}
              onChange={set('year')}
              error={errors.year}
              placeholder="Ex: 2024"
            />
            <FormField
              id="plate"
              label="Placa"
              value={form.plate}
              onChange={set('plate')}
              error={errors.plate}
              placeholder="Ex: ABC1D23"
            />
            <div className="col-span-2">
              <FormField
                id="categoryId"
                type="select"
                label="Categoria"
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
            to="/fleets"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || categoriesError}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Cadastrar Veículo'}
          </button>
        </div>
      </form>
    </div>
  )
}
