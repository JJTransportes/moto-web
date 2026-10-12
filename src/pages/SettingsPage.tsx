import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useBrandImage } from '../auth/BrandImageContext'
import FormField from '../components/FormField'
import ConfirmationModal from '../components/ConfirmationModal'
import { listCategories, createCategory, type CategorySummary } from '../api/categoryApi'
import { uploadBrandImage } from '../api/configApi'
import { validateRequired } from '../utils/validators'

interface FormValues {
  title: string
  description: string
}

const emptyForm: FormValues = {
  title: '',
  description: '',
}

export default function SettingsPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [pageStatus, setPageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [errors, setErrors] = useState<Partial<FormValues>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()
  const [categoryPage, setCategoryPage] = useState(1)
  const categoryPageSize = 10

  const loadCategories = useCallback(() => {
    if (!token) return
    setPageStatus('loading')
    listCategories(token).then(result => {
      if (result.ok) {
        setCategories(result.data)
        setCategoryPage(1)
        setPageStatus('loaded')
      } else {
        setPageStatus('error')
      }
    })
  }, [token])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const set = (field: keyof FormValues) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  function validate(): boolean {
    const e: Partial<FormValues> = {}
    e.title = validateRequired(form.title, 'Título')
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

    const result = await createCategory(token, {
      title: form.title,
      description: form.description.trim() || null,
      adminCode,
    })

    setModalLoading(false)

    if (result.ok) {
      setCategories(prev => [...prev, result.data])
      setIsModalOpen(false)
      setForm(emptyForm)
      setErrors({})
    } else {
      setModalError(result.message)
    }
  }

  const categoryTotalPages = Math.max(1, Math.ceil(categories.length / categoryPageSize))
  const currentCategoryPage = Math.min(categoryPage, categoryTotalPages)
  const pagedCategories = categories.slice(
    (currentCategoryPage - 1) * categoryPageSize,
    currentCategoryPage * categoryPageSize,
  )

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Configurações</h1>

      <BrandImageSection />

      {/* Existing categories list */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-700">Categorias existentes</h2>
          <button type="button" onClick={loadCategories} disabled={pageStatus === 'loading'} aria-label="Atualizar categorias" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${pageStatus === 'loading' ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {pageStatus === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Carregando...</p>
          </div>
        )}

        {pageStatus === 'error' && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Erro ao carregar categorias. Tente novamente.
          </div>
        )}

        {pageStatus === 'loaded' && categories.length === 0 && (
          <p className="text-sm text-gray-500 py-4">Nenhuma categoria cadastrada.</p>
        )}

        {pageStatus === 'loaded' && categories.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {pagedCategories.map(c => (
              <li key={c.categoryId} className="py-3">
                <p className="font-medium text-gray-900">{c.title}</p>
                {c.description && (
                  <p className="text-sm text-gray-500">{c.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {pageStatus === 'loaded' && categoryTotalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">Página {currentCategoryPage} de {categoryTotalPages}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCategoryPage(value => Math.max(1, value - 1))} disabled={currentCategoryPage === 1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">Anterior</button>
              <button type="button" onClick={() => setCategoryPage(value => Math.min(categoryTotalPages, value + 1))} disabled={currentCategoryPage === categoryTotalPages} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">Próximo</button>
            </div>
          </div>
        )}
      </div>

      {/* New category form */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-700">Nova categoria</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            id="title"
            label="Título"
            value={form.title}
            onChange={set('title')}
            error={errors.title}
            placeholder="Nome da categoria"
          />
          <FormField
            id="description"
            label="Descrição (opcional)"
            value={form.description}
            onChange={set('description')}
            placeholder="Descrição da categoria"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Criar Categoria
          </button>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirmar criação de categoria"
        description="Digite seu código de administrador para confirmar a criação da categoria."
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

function BrandImageSection() {
  const { token, hasMinimumRole } = useAuth()
  const { brandImageUrl, refetch } = useBrandImage()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Clean up preview object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (!isGlobalAdmin) return null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate format
    const allowed = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowed.includes(file.type)) {
      setErrorMsg('Formato não suportado. Use PNG ou JPEG.')
      return
    }

    // Revoke previous preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setErrorMsg(null)
  }

  async function handleUpload() {
    if (!selectedFile || !token) return
    setUploading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const result = await uploadBrandImage(token, selectedFile)

    setUploading(false)

    if (result.ok) {
      setSuccessMsg('Imagem da marca atualizada com sucesso.')
      setSelectedFile(null)
      // Revoke local preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      // Trigger brand image refetch across the app
      refetch()
    } else {
      setErrorMsg(result.message)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const displayImage = previewUrl ?? brandImageUrl

  return (
    <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-700">Imagem da Marca</h2>

      {displayImage && (
        <div className="mb-4 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-4">
          <img
            src={displayImage}
            alt="Brand preview"
            className="max-h-24 w-auto object-contain"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Escolher Arquivo
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <span className="text-sm text-slate-500">
          {selectedFile ? selectedFile.name : 'Nenhum arquivo selecionado'}
        </span>
        {selectedFile && (
          <button
            type="button"
            onClick={clearFile}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Remover
          </button>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      )}

      {successMsg && (
        <p className="mt-3 text-sm text-green-600">{successMsg}</p>
      )}
      {errorMsg && (
        <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
