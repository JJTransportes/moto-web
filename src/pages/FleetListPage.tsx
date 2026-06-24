import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchVehicles, type Vehicle } from '../api/vehicleApi'
import { Car, Plus, Search, Eye } from 'lucide-react'

type PageStatus = 'loading' | 'loaded' | 'empty' | 'error'

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
  const [search, setSearch] = useState('')

  const [sortColumn, setSortColumn] = useState<'brand' | 'model' | 'year'>('brand')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (!token) return
    setStatus('loading')
    setErrorMessage(undefined)
    fetchVehicles(token).then(result => {
      if (!result.ok) {
        setStatus('error')
        setErrorMessage(result.message)
        return
      }
      setVehicles(result.data)
      setStatus(result.data.length === 0 ? 'empty' : 'loaded')
    })
  }, [token])

  const filtered = useMemo(() => {
    let list = vehicles
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(v =>
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      if (sortColumn === 'year') {
        return (a.year - b.year) * dir
      }
      const aVal = (a[sortColumn] ?? '').toLowerCase()
      const bVal = (b[sortColumn] ?? '').toLowerCase()
      return aVal.localeCompare(bVal) * dir
    })
    return list
  }, [vehicles, search, sortColumn, sortDirection])

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
      {status !== 'empty' && status !== 'loading' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
              onClick={() => { setStatus('loading'); fetchVehicles(token!).then(r => {
                if (!r.ok) { setStatus('error'); setErrorMessage(r.message); return }
                setVehicles(r.data)
                setStatus(r.data.length === 0 ? 'empty' : 'loaded')
              })}}
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
          <p className="mt-4 text-gray-500">Nenhum veículo cadastrado.</p>
          {isGlobalAdmin && (
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
          {filtered.length === 0 && search ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-gray-500">Nenhum veículo encontrado para "{search}".</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                  {filtered.map(v => (
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
          )}
          <p className="text-sm text-gray-400">
            {filtered.length === vehicles.length
              ? `${vehicles.length} veículo(s)`
              : `${filtered.length} de ${vehicles.length} veículo(s)`}
          </p>
        </>
      )}
    </div>
  )
}
