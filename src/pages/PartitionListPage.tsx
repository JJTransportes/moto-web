import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listPartitions, type PublicPartition } from '../api/publicPartitionApi'

type PageStatus = 'loading' | 'empty' | 'loaded' | 'error'

const PAGE_SIZE = 10

export default function PartitionListPage() {
  const { token, hasMinimumRole } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const [partitions, setPartitions] = useState<PublicPartition[]>([])
  const [status, setStatus] = useState<PageStatus>('loading')
  // WEB-07: o endpoint `/api/public-partitions` não pagina no backend — é
  // uma lista administrativa (unidades públicas), não cresce como
  // motoristas/passageiros/veículos. Paginação client-side é proporcional
  // ao problema real (renderizar a lista toda de uma vez) sem precisar
  // mexer em backend/repositório pra isso.
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!token) return
    setStatus('loading')
    listPartitions(token).then(result => {
      if (!result.ok) { setStatus('error'); return }
      setPartitions(result.data)
      setPage(1)
      setStatus(result.data.length === 0 ? 'empty' : 'loaded')
    })
  }, [token])

  const totalPages = Math.max(1, Math.ceil(partitions.length / PAGE_SIZE))
  const pageItems = partitions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Unidades Públicas</h1>
        {isGlobalAdmin && (
          <Link
            to="/partitions/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nova Unidade
          </Link>
        )}
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Carregando...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">Erro ao carregar unidades. Tente novamente.</p>
        </div>
      )}

      {status === 'empty' && (
        <div className="rounded-xl bg-slate-50 p-12 text-center">
          <p className="text-gray-500">Nenhuma unidade cadastrada.</p>
          {isGlobalAdmin && (
            <Link
              to="/partitions/new"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Criar primeira unidade
            </Link>
          )}
        </div>
      )}

      {status === 'loaded' && (
        <>
          <div className="flex flex-col gap-3">
            {pageItems.map(p => (
              <Link
                key={p.partitionId}
                to={`/partitions/${p.partitionId}`}
                className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.identifier} · {p.acronym}</p>
                  {p.categoryTitles.length > 0 && (
                    <p className="text-xs text-blue-600 mt-0.5">{p.categoryTitles.join(', ')}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 truncate max-w-xs">{p.departments}</span>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
