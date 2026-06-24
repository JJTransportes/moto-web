import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listPartitions, type PublicPartition } from '../api/publicPartitionApi'

type PageStatus = 'loading' | 'empty' | 'loaded' | 'error'

export default function PartitionListPage() {
  const { token, hasMinimumRole } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const [partitions, setPartitions] = useState<PublicPartition[]>([])
  const [status, setStatus] = useState<PageStatus>('loading')

  useEffect(() => {
    if (!token) return
    setStatus('loading')
    listPartitions(token).then(result => {
      if (!result.ok) { setStatus('error'); return }
      setPartitions(result.data)
      setStatus(result.data.length === 0 ? 'empty' : 'loaded')
    })
  }, [token])

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
        <div className="flex flex-col gap-3">
          {partitions.map(p => (
            <Link
              key={p.partitionId}
              to={`/partitions/${p.partitionId}`}
              className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500">{p.identifier} · {p.acronym}</p>
                {p.categoryTitle && (
                  <p className="text-xs text-blue-600 mt-0.5">{p.categoryTitle}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 truncate max-w-xs">{p.departments}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
