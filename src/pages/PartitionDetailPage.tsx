import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPartition, type PublicPartitionDetail } from '../api/publicPartitionApi'
import { useAuth } from '../auth/AuthContext'

type PageStatus = 'loading' | 'loaded' | 'not-found' | 'error'

export default function PartitionDetailPage() {
  const { token, hasMinimumRole } = useAuth()
  const { partitionId } = useParams<{ partitionId: string }>()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const [partition, setPartition] = useState<PublicPartitionDetail | null>(null)
  const [status, setStatus] = useState<PageStatus>('loading')

  useEffect(() => {
    if (!token || !partitionId) return
    setStatus('loading')
    getPartition(token, partitionId).then(result => {
      if (!result.ok) {
        setStatus(result.status === 404 ? 'not-found' : 'error')
        return
      }
      setPartition(result.data)
      setStatus('loaded')
    })
  }, [token, partitionId])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-slate-50 p-12 text-center">
          <p className="text-gray-500">Unidade não encontrada.</p>
          <Link to="/partitions" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'error' || !partition) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">Erro ao carregar unidade. Tente novamente.</p>
        </div>
      </div>
    )
  }

  const addr = partition.address

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/partitions" className="text-sm text-blue-600 hover:underline">
            ← Unidades Públicas
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">{partition.name}</h1>
        </div>
        {isGlobalAdmin && (
          <Link
            to={`/partitions/${partition.partitionId}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Editar
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Informações gerais</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Identificador</dt>
              <dd className="font-medium text-gray-900">{partition.identifier}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Sigla</dt>
              <dd className="font-medium text-gray-900">{partition.acronym}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Secretarias</dt>
              <dd className="font-medium text-gray-900">{partition.departments}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Categoria</dt>
              <dd className="font-medium text-gray-900">{partition.categoryTitle ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">Endereço</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="col-span-2">
              <dt className="text-gray-500">Logradouro</dt>
              <dd className="font-medium text-gray-900">{addr.lineOne}</dd>
            </div>
            {addr.lineTwo && (
              <div className="col-span-2">
                <dt className="text-gray-500">Complemento</dt>
                <dd className="font-medium text-gray-900">{addr.lineTwo}</dd>
              </div>
            )}
            {addr.district && (
              <div>
                <dt className="text-gray-500">Bairro</dt>
                <dd className="font-medium text-gray-900">{addr.district}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Cidade</dt>
              <dd className="font-medium text-gray-900">{addr.city}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Estado</dt>
              <dd className="font-medium text-gray-900">{addr.state}</dd>
            </div>
            {addr.postalCode && (
              <div>
                <dt className="text-gray-500">CEP</dt>
                <dd className="font-medium text-gray-900">{addr.postalCode}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">País</dt>
              <dd className="font-medium text-gray-900">{addr.countryCode}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
