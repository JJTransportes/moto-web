import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listDrivers, listPassengers } from '../api/userListApi'
import type { DriverListItem, PassengerListItem } from '../api/userListApi'
import { fetchUserProfilePhoto, activateUserAccount, deactivateUserAccount } from '../api/userApi'
import ConfirmationModal from '../components/ConfirmationModal'
import Toast from '../components/Toast'
import UserAvatar from '../components/UserAvatar'
import { Users, Search, ChevronLeft, ChevronRight, Power } from 'lucide-react'

type Role = 'drivers' | 'passengers'
type PageStatus = 'loading' | 'loaded' | 'error' | 'empty'

const PAGE_SIZE = 20

// Matches the backend's SearchTermSanitizer.MaxLength cap on GET /api/drivers|passengers.
const SEARCH_MAX_LENGTH = 100

function sanitizeSearchInput(value: string): string {
  return value.replace(/[<>]|--|\/\*|\*\//g, '')
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
        </div>
      ))}
    </div>
  )
}

export default function UsersPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('drivers')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>()
  // Tracks whether we have anything on screen worth keeping visible during a
  // refetch (search/page change). Only the very first fetch for a role shows
  // the full skeleton; subsequent ones just dim the existing table instead of
  // swapping it out, so typing in the search box doesn't cause a visual reset.
  const [isFetching, setIsFetching] = useState(false)
  const hasDataRef = useRef(false)

  const [drivers, setDrivers] = useState<DriverListItem[]>([])
  const [passengers, setPassengers] = useState<PassengerListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [photoMap, setPhotoMap] = useState<Map<string, string | null>>(new Map())

  // Activate/deactivate state
  const [statusTarget, setStatusTarget] = useState<{ userId: string; fullName: string; isActive: boolean } | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | undefined>()
  const [successMessage, setSuccessMessage] = useState<string | undefined>()

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(false)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  // Reset page to 1 on role change
  useEffect(() => {
    setPage(1)
    hasDataRef.current = false
  }, [role])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return

    setIsFetching(true)
    setErrorMessage(undefined)
    abortRef.current = false

    // Only the first fetch (no data on screen yet) shows the full skeleton —
    // refetches triggered by typing/paging keep the current table visible.
    if (!hasDataRef.current) {
      setPageStatus('loading')
    }

    if (role === 'drivers') {
      const result = await listDrivers(token, page, PAGE_SIZE, search || undefined)
      if (abortRef.current) return
      setIsFetching(false)
      if (result.ok) {
        setDrivers(result.data.items)
        setTotalCount(result.data.totalCount)
        setPageStatus(result.data.items.length === 0 ? 'empty' : 'loaded')
        hasDataRef.current = true
      } else {
        setErrorMessage(result.message)
        setPageStatus('error')
        hasDataRef.current = false
      }
    } else {
      const result = await listPassengers(token, page, PAGE_SIZE, search || undefined)
      if (abortRef.current) return
      setIsFetching(false)
      if (result.ok) {
        setPassengers(result.data.items)
        setTotalCount(result.data.totalCount)
        setPageStatus(result.data.items.length === 0 ? 'empty' : 'loaded')
        hasDataRef.current = true
      } else {
        setErrorMessage(result.message)
        setPageStatus('error')
        hasDataRef.current = false
      }
    }
  }, [token, role, page, search])

  useEffect(() => {
    fetchData()
    return () => {
      abortRef.current = true
    }
  }, [fetchData])

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(undefined), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleToggleStatus = useCallback(async (adminCode: string) => {
    if (!token || !statusTarget) return
    setStatusLoading(true)
    setStatusError(undefined)

    const result = statusTarget.isActive
      ? await deactivateUserAccount(token, statusTarget.userId, adminCode)
      : await activateUserAccount(token, statusTarget.userId, adminCode)

    if (result.ok) {
      const label = statusTarget.isActive ? 'inativada' : 'ativada'
      setStatusTarget(null)
      setStatusLoading(false)
      setStatusError(undefined)
      setSuccessMessage(`Conta de ${statusTarget.fullName} ${label} com sucesso.`)
      await fetchData()
    } else if (result.status === 401) {
      setStatusError(result.message)
      setStatusLoading(false)
    } else {
      setStatusTarget(null)
      setStatusLoading(false)
      setStatusError(undefined)
      setSuccessMessage(result.message)
    }
  }, [token, statusTarget, fetchData])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = pageStatus === 'loading'
  const items: (DriverListItem | PassengerListItem)[] =
    role === 'drivers' ? drivers : passengers

  // Fetch photos for visible items
  useEffect(() => {
    if (pageStatus !== 'loaded' || !token) return

    const ids = items.map((item) =>
      role === 'drivers'
        ? (item as DriverListItem).userId
        : (item as PassengerListItem).userId,
    )

    ids.forEach((id) => {
      if (photoMap.has(id)) return
      fetchUserProfilePhoto(token, id).then((result) => {
        if (result.ok) {
          setPhotoMap((prev) => {
            const next = new Map(prev)
            next.set(id, result.data.photoUrl)
            return next
          })
        }
      })
    })
  }, [pageStatus, items.length, role, token])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
      </div>

      {/* Role Selector */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setRole('drivers')}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            role === 'drivers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Motoristas
        </button>
        <button
          onClick={() => setRole('passengers')}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            role === 'passengers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Passageiros
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(sanitizeSearchInput(e.target.value))}
          placeholder="Buscar por nome, e-mail, CPF ou RG..."
          maxLength={SEARCH_MAX_LENGTH}
          className="w-full max-w-md pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content Area */}
      {isLoading && <TableSkeleton />}

      {pageStatus === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {pageStatus === 'empty' && (
        <div className={`rounded-lg border border-gray-200 bg-white p-12 text-center transition-opacity duration-150 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
          <p className="text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      )}

      {pageStatus === 'loaded' && (
        <div className={`space-y-4 transition-opacity duration-150 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {role === 'drivers' ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Total de Viagens
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Ações
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Unidade Pública
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Total de Solicitações
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Ações
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={role === 'drivers' ? (item as DriverListItem).driverId : (item as PassengerListItem).passengerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          photoUrl={(() => {
                            const id = role === 'drivers'
                              ? (item as DriverListItem).userId
                              : (item as PassengerListItem).userId
                            return photoMap.get(id) ?? null
                          })()}
                          fullName={item.fullName}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {item.fullName}
                        </span>
                      </div>
                    </td>
                    {role === 'drivers' ? (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(item as DriverListItem).categoryTitle ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                          {(item as DriverListItem).travelCount}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(item as PassengerListItem).publicPartitionName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                          {(item as PassengerListItem).solicitationCount}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge isActive={item.isActive} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const navigateId =
                              role === 'drivers'
                                ? (item as DriverListItem).userId
                                : (item as PassengerListItem).passengerId
                            navigate(`/users/${role}/${navigateId}`)
                          }}
                          disabled={isLoading}
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Selecionar
                        </button>
                        {item.userId !== user?.userId && (
                          <button
                            onClick={() =>
                              setStatusTarget({
                                userId:
                                  role === 'drivers'
                                    ? (item as DriverListItem).userId
                                    : (item as PassengerListItem).userId,
                                fullName: item.fullName,
                                isActive: item.isActive,
                              })
                            }
                            disabled={isLoading}
                            className={`inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.isActive
                              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                              : 'border-green-300 text-green-700 hover:bg-green-50'
                              }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {item.isActive ? 'Inativar' : 'Ativar'}
                          </button>
                        )}
                      </div>
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <Toast message={successMessage} onClose={() => setSuccessMessage(undefined)} />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusTarget !== null}
        title={statusTarget?.isActive ? 'Inativar conta' : 'Ativar conta'}
        description={
          statusTarget
            ? statusTarget.isActive
              ? `Digite seu código de administrador para inativar a conta de ${statusTarget.fullName}. Você pode reativá-la depois.`
              : `Digite seu código de administrador para reativar a conta de ${statusTarget.fullName}.`
            : ''
        }
        onConfirm={handleToggleStatus}
        onCancel={() => {
          setStatusTarget(null)
          setStatusError(undefined)
        }}
        loading={statusLoading}
        error={statusError}
      />
    </div>
  )
}
