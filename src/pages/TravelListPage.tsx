import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchTravels } from '../api/travelApi'
import type { TravelAdminListItem, TravelStatus } from '../types/travel'
import TravelStatusBadge from '../components/travel/TravelStatusBadge'
import { Eye, Route, ChevronLeft, ChevronRight } from 'lucide-react'

type PageStatus = 'loading' | 'loaded' | 'error' | 'empty'

interface FilterState {
  status: TravelStatus[]
  createdFrom: string
  createdTo: string
}

const ALL_STATUSES: TravelStatus[] = ['Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled']

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/5" />
          <div className="h-4 bg-gray-200 rounded w-1/5" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-8" />
        </div>
      ))}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TravelListPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [items, setItems] = useState<TravelAdminListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    createdFrom: '',
    createdTo: '',
  })

  const abortRef = useRef(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pageSize = 20

  // Close status dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = useCallback(async () => {
    if (!token) return
    setPageStatus('loading')
    setErrorMessage(undefined)
    abortRef.current = false

    const params: {
      page: number
      pageSize: number
      status?: string[]
      createdFrom?: string
      createdTo?: string
    } = { page, pageSize }

    if (filters.status.length > 0) params.status = filters.status
    if (filters.createdFrom) params.createdFrom = filters.createdFrom
    if (filters.createdTo) params.createdTo = filters.createdTo

    const result = await fetchTravels(token, params)
    if (abortRef.current) return

    if (result.ok) {
      setItems(result.data.items)
      setTotalCount(result.data.totalCount)
      setPageStatus(result.data.items.length === 0 ? 'empty' : 'loaded')
    } else {
      setErrorMessage(result.message)
      setPageStatus('error')
    }
  }, [token, page, filters])

  useEffect(() => {
    fetchData()
    return () => {
      abortRef.current = true
    }
  }, [fetchData])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const isLoading = pageStatus === 'loading'

  const toggleStatus = (s: TravelStatus) => {
    setFilters(prev => {
      const next = prev.status.includes(s)
        ? prev.status.filter(x => x !== s)
        : [...prev.status, s]
      return { ...prev, status: next }
    })
    setPage(1)
  }

  const statusLabel = (s: TravelStatus): string => {
    const labels: Record<TravelStatus, string> = {
      Pending: 'Pendente',
      Accepted: 'Aceita',
      InProgress: 'Em Andamento',
      Completed: 'Concluída',
      Cancelled: 'Cancelada',
    }
    return labels[s]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Route className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Corridas</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Status dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(prev => !prev)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Status
            {filters.status.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {filters.status.length}
              </span>
            )}
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showStatusDropdown && (
            <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
              {ALL_STATUSES.map(s => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(s)}
                    onChange={() => toggleStatus(s)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {statusLabel(s)}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date filters */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">De</label>
          <input
            type="date"
            value={filters.createdFrom}
            onChange={e => { setFilters(prev => ({ ...prev, createdFrom: e.target.value })); setPage(1) }}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Até</label>
          <input
            type="date"
            value={filters.createdTo}
            onChange={e => { setFilters(prev => ({ ...prev, createdTo: e.target.value })); setPage(1) }}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Clear filters */}
        {(filters.status.length > 0 || filters.createdFrom || filters.createdTo) && (
          <button
            type="button"
            onClick={() => { setFilters({ status: [], createdFrom: '', createdTo: '' }); setPage(1) }}
            className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && <TableSkeleton />}

      {pageStatus === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            <button
              onClick={fetchData}
              className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {pageStatus === 'empty' && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Nenhuma viagem encontrada.</p>
        </div>
      )}

      {pageStatus === 'loaded' && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Passageiro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Motorista
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Destino
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Opções
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.travelId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.passengerName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.driverName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                      {item.destinationAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TravelStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/routes/${item.travelId}`)}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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
                Página {page} de {totalPages} ({totalCount} resultados)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
