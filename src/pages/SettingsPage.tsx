import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!token) return
    listCategories(token).then(result => {
      if (result.ok) {
        setCategories(result.data)
        setPageStatus('loaded')
      } else {
        setPageStatus('error')
      }
    })
  }, [token])

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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Configurações</h1>

      <BrandImageSection />

      {/* Existing categories list */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-700">Categorias existentes</h2>

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
            {categories.map(c => (
              <li key={c.categoryId} className="py-3">
                <p className="font-medium text-gray-900">{c.title}</p>
                {c.description && (
                  <p className="text-sm text-gray-500">{c.description}</p>
                )}
              </li>
            ))}
          </ul>
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
