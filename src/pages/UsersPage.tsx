import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listDrivers, listPassengers } from '../api/userListApi'
import type { DriverListItem, PassengerListItem } from '../api/userListApi'
import { fetchUserProfilePhoto, deleteUserAccount } from '../api/userApi'
import ConfirmationModal from '../components/ConfirmationModal'
import UserAvatar from '../components/UserAvatar'
import { Users, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

type Role = 'drivers' | 'passengers'
type PageStatus = 'loading' | 'loaded' | 'error' | 'empty'

const PAGE_SIZE = 20

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

  const [drivers, setDrivers] = useState<DriverListItem[]>([])
  const [passengers, setPassengers] = useState<PassengerListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [photoMap, setPhotoMap] = useState<Map<string, string | null>>(new Map())

  // Deletion state
  const [deletingUser, setDeletingUser] = useState<{ userId: string; fullName: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()
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
  }, [role])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return

    setPageStatus('loading')
    setErrorMessage(undefined)
    abortRef.current = false

    if (role === 'drivers') {
      const result = await listDrivers(token, page, PAGE_SIZE, search || undefined)
      if (abortRef.current) return
      if (result.ok) {
        setDrivers(result.data.items)
        setTotalCount(result.data.totalCount)
        setPageStatus(result.data.items.length === 0 ? 'empty' : 'loaded')
      } else {
        setErrorMessage(result.message)
        setPageStatus('error')
      }
    } else {
      const result = await listPassengers(token, page, PAGE_SIZE, search || undefined)
      if (abortRef.current) return
      if (result.ok) {
        setPassengers(result.data.items)
        setTotalCount(result.data.totalCount)
        setPageStatus(result.data.items.length === 0 ? 'empty' : 'loaded')
      } else {
        setErrorMessage(result.message)
        setPageStatus('error')
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

  const handleDelete = useCallback(async (adminCode: string) => {
    if (!token || !deletingUser) return
    setDeleteLoading(true)
    setDeleteError(undefined)

    const result = await deleteUserAccount(token, deletingUser.userId, adminCode)

    if (result.ok) {
      setDeletingUser(null)
      setDeleteLoading(false)
      setDeleteError(undefined)
      setSuccessMessage(`Conta de ${deletingUser.fullName} excluída com sucesso.`)
      await fetchData()
    } else if (result.status === 401) {
      setDeleteError(result.message)
      setDeleteLoading(false)
    } else {
      setDeletingUser(null)
      setDeleteLoading(false)
      setDeleteError(undefined)
      setSuccessMessage(result.message)
    }
  }, [token, deletingUser, fetchData])

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
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome, e-mail, CPF ou RG..."
          disabled={isLoading}
          className="w-full max-w-md pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      )}

      {pageStatus === 'loaded' && (
        <>
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
                            const userId =
                              role === 'drivers'
                                ? (item as DriverListItem).userId
                                : (item as PassengerListItem).userId
                            navigate(`/users/${role}/${userId}`)
                          }}
                          disabled={isLoading}
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Selecionar
                        </button>
                        {item.isActive && item.userId !== user?.userId && (
                          <button
                            onClick={() =>
                              setDeletingUser({
                                userId:
                                  role === 'drivers'
                                    ? (item as DriverListItem).userId
                                    : (item as PassengerListItem).userId,
                                fullName: item.fullName,
                              })
                            }
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
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
        </>
      )}

      {/* Success notification */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingUser !== null}
        title="Excluir conta"
        description={
          deletingUser
            ? `Tem certeza que deseja excluir a conta de ${deletingUser.fullName}? Esta ação é irreversível.`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => {
          setDeletingUser(null)
          setDeleteError(undefined)
        }}
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  )
}
