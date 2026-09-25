import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchVehicles, type Vehicle } from '../api/vehicleApi'
import { Car, Plus, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

type PageStatus = 'loading' | 'loaded' | 'empty' | 'error'

const PAGE_SIZE = 20

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-8" />
        </div>
      ))}
    </div>
  )
}

export default function FleetListPage() {
  const { token, hasMinimumRole } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [status, setStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()

  // WEB-06: paginação server-side (mesmo padrão de UsersPage/TravelListPage)
  // — antes buscava a frota inteira de uma vez, sem limite, num único
  // request, e filtrava/ordenava tudo em memória no navegador.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const hasDataRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(false)

  const [sortColumn, setSortColumn] = useState<'brand' | 'model' | 'year'>('brand')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Debounce da busca — evita 1 request por tecla digitada.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  const fetchData = useCallback(async () => {
    if (!token) return
    abortRef.current = false
    if (!hasDataRef.current) setStatus('loading')
    setErrorMessage(undefined)

    const result = await fetchVehicles(token, page, PAGE_SIZE, search || undefined)
    if (abortRef.current) return

    if (!result.ok) {
      setStatus('error')
      setErrorMessage(result.message)
      hasDataRef.current = false
      return
    }
    setVehicles(result.data.items)
    setTotalCount(result.data.totalCount)
    setStatus(result.data.items.length === 0 ? 'empty' : 'loaded')
    hasDataRef.current = true
  }, [token, page, search])

  useEffect(() => {
    fetchData()
    return () => {
      abortRef.current = true
    }
  }, [fetchData])

  // Ordenação só se aplica à página atual carregada — servidor já pagina;
  // ordenar globalmente exigiria ORDER BY dinâmico no backend, fora do
  // escopo desta correção (o problema original era volume, não ordenação).
  const sorted = [...vehicles].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    if (sortColumn === 'year') return (a.year - b.year) * dir
    const aVal = (a[sortColumn] ?? '').toLowerCase()
    const bVal = (b[sortColumn] ?? '').toLowerCase()
    return aVal.localeCompare(bVal) * dir
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = status === 'loading'

  function handleSort(col: 'brand' | 'model' | 'year') {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  function SortArrow({ col }: { col: 'brand' | 'model' | 'year' }) {
    if (sortColumn !== col) return null
    return <span className="ml-1 text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Frotas</h1>
        </div>
        {isGlobalAdmin && status !== 'loading' && (
          <Link
            to="/fleets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Link>
        )}
      </div>

      {/* Search */}
      {!(status === 'empty' && !search) && status !== 'loading' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por marca, modelo ou placa..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && <TableSkeleton />}

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            <button
              onClick={() => fetchData()}
              className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {status === 'empty' && (
        <div className="rounded-xl bg-slate-50 p-12 text-center">
          <Car className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-gray-500">
            {search ? `Nenhum veículo encontrado para "${search}".` : 'Nenhum veículo cadastrado.'}
          </p>
          {isGlobalAdmin && !search && (
            <Link
              to="/fleets/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Cadastrar primeiro veículo
            </Link>
          )}
        </div>
      )}

      {/* Table */}
      {status === 'loaded' && (
        <>
          <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${isLoading ? 'opacity-60' : ''}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('brand')}
                  >
                    Marca<SortArrow col="brand" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('model')}
                  >
                    Modelo<SortArrow col="model" />
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('year')}
                  >
                    Ano<SortArrow col="year" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Placa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Motorista
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(v => (
                  <tr key={v.vehicleId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {v.brand}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {v.model}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {v.year}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {v.plate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {v.categoryTitle ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.driverId === null ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Em uso
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {v.driverName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/fleets/${v.vehicleId}`}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages} ({totalCount} resultado{totalCount === 1 ? '' : 's'})
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {totalPages <= 1 && (
            <p className="text-sm text-gray-400">
              {totalCount} veículo{totalCount === 1 ? '' : 's'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
