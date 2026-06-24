import { useState } from 'react'
import type { PendingRegistration } from '../../types/dashboard'

interface PendingRegistrationsTableProps {
  items: PendingRegistration[]
  loading: boolean
  error: string | null
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason?: string) => Promise<void>
  onRetry: () => void
}

export default function PendingRegistrationsTable({
  items,
  loading,
  error,
  onApprove,
  onReject,
  onRetry,
}: PendingRegistrationsTableProps) {
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showConfirmApprove, setShowConfirmApprove] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setApprovingId(id)
    try {
      await onApprove(id)
    } finally {
      setApprovingId(null)
      setShowConfirmApprove(null)
    }
  }

  async function handleReject(id: string) {
    setRejectingId(id)
    try {
      await onReject(id, rejectionReason || undefined)
      setRejectionReason('')
      setShowRejectDialog(null)
    } finally {
      setRejectingId(null)
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Cadastros Pendentes</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-5 flex-1 rounded bg-gray-200" />
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-5 w-24 rounded bg-gray-200" />
              <div className="h-5 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Cadastros Pendentes</h2>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <p>{error}</p>
          <button
            onClick={onRetry}
            className="mt-1 font-medium underline hover:text-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Cadastros Pendentes{' '}
        {items.length > 0 && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
            {items.length}
          </span>
        )}
      </h2>

      {items.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <svg
            className="mx-auto mb-2 h-10 w-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>Nenhuma solicitação de cadastro pendente</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="pb-2 pr-4 font-medium">Nome</th>
                <th className="pb-2 pr-4 font-medium">E-mail</th>
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Unidade</th>
                <th className="pb-2 pr-4 font-medium">Secretaria</th>
                <th className="pb-2 pr-4 font-medium">Data</th>
                <th className="pb-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((reg) => (
                <tr key={reg.registrationId} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">
                    {reg.fullName}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{reg.email}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        reg.role === 'Passenger'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {reg.role === 'Passenger' ? 'Passageiro' : 'Motorista'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {reg.publicPartitionName || '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {reg.department || '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {new Date(reg.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-2">
                      {/* Approve button */}
                      {showConfirmApprove === reg.registrationId ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(reg.registrationId)}
                            disabled={approvingId === reg.registrationId}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {approvingId === reg.registrationId
                              ? '...'
                              : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setShowConfirmApprove(null)}
                            className="rounded bg-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-400"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowConfirmApprove(reg.registrationId)}
                          disabled={approvingId !== null || rejectingId !== null}
                          className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                      )}

                      {/* Reject button */}
                      {showRejectDialog === reg.registrationId ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Motivo (opcional)"
                            className="w-32 rounded border border-gray-300 px-2 py-1 text-xs"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleReject(reg.registrationId)}
                              disabled={rejectingId === reg.registrationId}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {rejectingId === reg.registrationId
                                ? '...'
                                : 'Rejeitar'}
                            </button>
                            <button
                              onClick={() => {
                                setShowRejectDialog(null)
                                setRejectionReason('')
                              }}
                              className="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRejectDialog(reg.registrationId)}
                          disabled={approvingId !== null || rejectingId !== null}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Rejeitar
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
    </section>
  )
}
