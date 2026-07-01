import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  listUsageTerms,
  createUsageTerm,
  updateUsageTerm,
  activateUsageTerm,
  deactivateUsageTerm,
  type UsageTerm,
  type SubTermInput,
} from '../api/usageTermsApi'
import { FileText, Plus, Edit2, CheckCircle, XCircle, ArrowLeft, Save } from 'lucide-react'

type ViewMode = 'list' | 'create' | 'edit'

interface SubTermForm {
  key: string // unique React key
  subTermId: string | null // null for new, guid for existing
  title: string
  content: string
}

interface UsageTermForm {
  title: string
  subTerms: SubTermForm[]
}

const emptyForm: UsageTermForm = {
  title: '',
  subTerms: [{ key: '1', subTermId: null, title: '', content: '' }],
}

type PageStatus = 'loading' | 'loaded' | 'empty' | 'error'

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
        </div>
      ))}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function UsageTermsPage() {
  const { token } = useAuth()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [usageTerms, setUsageTerms] = useState<UsageTerm[]>([])

  // Form state
  const [form, setForm] = useState<UsageTermForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [actionLoading, setActionLoading] = useState(false)

  let keyCounter = 2

  // Fetch list
  const fetchList = useCallback(async () => {
    if (!token) return
    setPageStatus('loading')
    setErrorMessage(undefined)
    const result = await listUsageTerms(token)
    if (!result.ok) {
      setPageStatus('error')
      setErrorMessage(result.message)
      return
    }
    setUsageTerms(result.data)
    setPageStatus(result.data.length === 0 ? 'empty' : 'loaded')
  }, [token])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // --- Form helpers ---
  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setFormErrors({})
    setFormError(undefined)
    keyCounter = 2
  }

  function startCreate() {
    resetForm()
    setViewMode('create')
  }

  function startEdit(term: UsageTerm) {
    setEditingId(term.usageTermId)
    setForm({
      title: term.title,
      subTerms: term.subTerms.map((st, i) => ({
        key: String(i + 1),
        subTermId: st.subTermId,
        title: st.title,
        content: st.content,
      })),
    })
    setFormErrors({})
    setFormError(undefined)
    setViewMode('edit')
  }

  function backToList() {
    resetForm()
    setViewMode('list')
  }

  function setFormField(value: string) {
    setForm((prev) => ({ ...prev, title: value }))
  }

  function setSubTermField(index: number, field: 'title' | 'content') {
    return (value: string) => {
      setForm((prev) => {
        const subTerms = [...prev.subTerms]
        subTerms[index] = { ...subTerms[index], [field]: value }
        return { ...prev, subTerms }
      })
    }
  }

  function addSubTerm() {
    setForm((prev) => ({
      ...prev,
      subTerms: [
        ...prev.subTerms,
        { key: String(keyCounter++), subTermId: null, title: '', content: '' },
      ],
    }))
  }

  function removeSubTerm(index: number) {
    setForm((prev) => {
      if (prev.subTerms.length <= 1) return prev
      const subTerms = prev.subTerms.filter((_, i) => i !== index)
      return { ...prev, subTerms }
    })
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!form.title.trim()) errors['title'] = 'Título é obrigatório.'

    form.subTerms.forEach((st, i) => {
      if (!st.title.trim()) errors[`subTerms.${i}.title`] = 'Título do sub-termo é obrigatório.'
      if (!st.content.trim()) errors[`subTerms.${i}.content`] = 'Conteúdo do sub-termo é obrigatório.'
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!validateForm()) return

    setFormSubmitting(true)
    setFormError(undefined)

    const subTermsInput: SubTermInput[] = form.subTerms.map((st) => ({
      subTermId: st.subTermId,
      title: st.title.trim(),
      content: st.content.trim(),
    }))

    const result =
      viewMode === 'create'
        ? await createUsageTerm(token, {
            title: form.title.trim(),
            subTerms: subTermsInput,
          })
        : await updateUsageTerm(token, editingId!, {
            title: form.title.trim(),
            subTerms: subTermsInput,
          })

    setFormSubmitting(false)
    if (result.ok) {
      await fetchList()
      backToList()
    } else {
      setFormError(result.message)
    }
  }

  // --- Actions ---
  async function handleActivate(id: string) {
    if (!token) return
    setActionLoading(true)
    const result = await activateUsageTerm(token, id)
    setActionLoading(false)
    if (result.ok) {
      setUsageTerms((prev) =>
        prev.map((t) => ({
          ...t,
          isActive: t.usageTermId === id,
        }))
      )
    } else {
      setErrorMessage(result.message)
    }
  }

  async function handleDeactivate(id: string) {
    if (!token) return
    setActionLoading(true)
    const result = await deactivateUsageTerm(token, id)
    setActionLoading(false)
    if (result.ok) {
      setUsageTerms((prev) =>
        prev.map((t) => (t.usageTermId === id ? { ...t, isActive: false } : t))
      )
    } else {
      setErrorMessage(result.message)
    }
  }

  // --- Render: List View ---
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Termos de Uso</h1>
          </div>
          <button
            onClick={startCreate}
            disabled={pageStatus === 'loading'}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Novo Termo
          </button>
        </div>

        {/* Loading */}
        {pageStatus === 'loading' && <TableSkeleton />}

        {/* Error */}
        {pageStatus === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              <button
                onClick={fetchList}
                className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {pageStatus === 'empty' && (
          <div className="rounded-xl bg-slate-50 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-gray-500">Nenhum termo de uso cadastrado.</p>
            <button
              onClick={startCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro termo
            </button>
          </div>
        )}

        {/* Table */}
        {pageStatus === 'loaded' && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Título
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sub-Termos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Criado em
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usageTerms.map((term) => (
                  <tr key={term.usageTermId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {term.title}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {term.subTerms.length}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge isActive={term.isActive} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(term.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(term)}
                          disabled={actionLoading}
                          title="Editar"
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {term.isActive ? (
                          <button
                            onClick={() => handleDeactivate(term.usageTermId)}
                            disabled={actionLoading}
                            title="Desativar"
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(term.usageTermId)}
                            disabled={actionLoading}
                            title="Ativar"
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // --- Render: Create / Edit View ---
  const isEditing = viewMode === 'edit'
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={backToList}
          disabled={formSubmitting}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Termo de Uso' : 'Novo Termo de Uso'}
        </h1>
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* General info */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Informações gerais</h2>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setFormField(e.target.value)}
              disabled={formSubmitting}
              placeholder="Ex: Termos de Uso - 2024"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                formErrors['title'] ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {formErrors['title'] && (
              <p className="mt-1 text-xs text-red-500" role="alert">{formErrors['title']}</p>
            )}
          </div>
        </div>

        {/* Sub Terms */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Sub-Termos</h2>
            <button
              type="button"
              onClick={addSubTerm}
              disabled={formSubmitting}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              Adicionar Sub-Termo
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {form.subTerms.map((st, index) => (
              <div
                key={st.key}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sub-Termo {index + 1}
                  </span>
                  {form.subTerms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubTerm(index)}
                      disabled={formSubmitting}
                      className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor={`subterm-title-${st.key}`}
                      className="mb-1 block text-xs font-medium text-gray-600"
                    >
                      Título
                    </label>
                    <input
                      id={`subterm-title-${st.key}`}
                      type="text"
                      value={st.title}
                      onChange={(e) => setSubTermField(index, 'title')(e.target.value)}
                      disabled={formSubmitting}
                      placeholder="Título do sub-termo"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                        formErrors[`subTerms.${index}.title`]
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors[`subTerms.${index}.title`] && (
                      <p className="mt-1 text-xs text-red-500" role="alert">
                        {formErrors[`subTerms.${index}.title`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor={`subterm-content-${st.key}`}
                      className="mb-1 block text-xs font-medium text-gray-600"
                    >
                      Conteúdo
                    </label>
                    <textarea
                      id={`subterm-content-${st.key}`}
                      value={st.content}
                      onChange={(e) => setSubTermField(index, 'content')(e.target.value)}
                      disabled={formSubmitting}
                      placeholder="Conteúdo do sub-termo"
                      rows={4}
                      className={`w-full resize-y rounded-lg border px-3 py-2 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                        formErrors[`subTerms.${index}.content`]
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    />
                    {formErrors[`subTerms.${index}.content`] && (
                      <p className="mt-1 text-xs text-red-500" role="alert">
                        {formErrors[`subTerms.${index}.content`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={backToList}
            disabled={formSubmitting}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={formSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {formSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Termo' : 'Criar Termo'}
          </button>
        </div>
      </form>
    </div>
  )
}
