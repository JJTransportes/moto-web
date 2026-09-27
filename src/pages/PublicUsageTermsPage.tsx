import { useEffect, useState } from 'react'
import {
  getPublicActiveUsageTerm,
  type PublicUsageTerm,
} from '../api/usageTermsApi'
import { FileText, AlertCircle, Loader2 } from 'lucide-react'

type PageStatus = 'loading' | 'loaded' | 'empty' | 'error'

export default function PublicUsageTermsPage() {
  const [status, setStatus] = useState<PageStatus>('loading')
  const [terms, setTerms] = useState<PublicUsageTerm | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    // WEB-14: AbortController em vez da flag manual `cancelled`.
    const controller = new AbortController()

    async function load() {
      setStatus('loading')
      setErrorMessage(undefined)

      try {
        const result = await getPublicActiveUsageTerm(controller.signal)

        if (result.ok) {
          setTerms(result.data)
          setStatus('loaded')
        } else if (result.status === 404) {
          setStatus('empty')
        } else {
          setStatus('error')
          setErrorMessage(result.message)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('error')
        setErrorMessage('Erro de conexão. Tente novamente.')
      }
    }

    load()

    return () => {
      controller.abort()
    }
  }, [])

  // --- Loading ---
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando termos de uso...</p>
        </div>
      </div>
    )
  }

  // --- Empty (no active terms) ---
  if (status === 'empty') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h1 className="mt-4 text-xl font-semibold text-gray-700">Termos de Uso</h1>
          <p className="mt-2 text-sm text-gray-500">
            Nenhum termo de uso disponível no momento. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    )
  }

  // --- Error ---
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-300" />
          <h1 className="mt-4 text-xl font-semibold text-gray-700">Erro</h1>
          <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
        </div>
      </div>
    )
  }

  // --- Loaded ---
  if (!terms) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
          <h1 className="pb-6 text-3xl font-semibold">Termos de Uso</h1>
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {terms.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
        <div className="space-y-8">
          {terms.subTerms.map((subTerm) => (
            <section key={subTerm.subTermId}>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">
                {subTerm.title}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {subTerm.content}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-gray-400">
          Última atualização: versão atual vigente.
        </p>
      </div>
    </div>
  )
}
