import { fetchProtected } from './authApi'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export interface PublicSubTerm {
  subTermId: string
  title: string
  content: string
  sortOrder: number
}

export interface PublicUsageTerm {
  usageTermId: string
  title: string
  subTerms: PublicSubTerm[]
}

export type GetPublicActiveUsageTermResult =
  | { ok: true; data: PublicUsageTerm }
  | { ok: false; status: number; message: string }

export async function getPublicActiveUsageTerm(): Promise<GetPublicActiveUsageTermResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/usage-terms/public/active`)

    if (res.ok) {
      const data = (await res.json()) as PublicUsageTerm
      return { ok: true, data }
    }

    const message =
      res.status === 404
        ? 'Nenhum termo de uso disponível no momento.'
        : 'Erro ao carregar termos de uso. Tente novamente.'
    return { ok: false, status: res.status, message }
  } catch {
    return { ok: false, status: 0, message: 'Erro de conexão. Tente novamente.' }
  }
}

export interface SubTerm {
  subTermId: string
  title: string
  content: string
  sortOrder: number
}

export interface SubTermInput {
  subTermId: string | null // null for new, guid for existing
  title: string
  content: string
}

export interface UsageTerm {
  usageTermId: string
  title: string
  isActive: boolean
  subTerms: SubTerm[]
  createdAt: string
  updatedAt: string
}

export interface CreateUsageTermInput {
  title: string
  subTerms: SubTermInput[]
}

export type UpdateUsageTermInput = CreateUsageTermInput

export type ListUsageTermsResult =
  | { ok: true; data: UsageTerm[] }
  | { ok: false; status: number; message: string }

export type GetUsageTermResult =
  | { ok: true; data: UsageTerm }
  | { ok: false; status: number; message: string }

export type CreateUsageTermResult =
  | { ok: true; data: UsageTerm }
  | { ok: false; status: number; message: string }

export type UpdateUsageTermResult =
  | { ok: true; data: UsageTerm }
  | { ok: false; status: number; message: string }

export type ActivateUsageTermResult =
  | { ok: true; data: UsageTerm }
  | { ok: false; status: number; message: string }

export type DeactivateUsageTermResult =
  | { ok: true; data: UsageTerm }
  | { ok: false; status: number; message: string }

export async function listUsageTerms(token: string): Promise<ListUsageTermsResult> {
  const result = await fetchProtected<{ items: UsageTerm[] }>('/api/usage-terms', token)
  if (result.ok) return { ok: true, data: result.data.items }
  return { ok: false, status: result.status, message: 'Erro ao carregar termos de uso. Tente novamente.' }
}

export async function getUsageTerm(token: string, id: string): Promise<GetUsageTermResult> {
  const result = await fetchProtected<UsageTerm>(`/api/usage-terms/${id}`, token)
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 404
      ? 'Termo de uso não encontrado.'
      : 'Erro ao carregar termo de uso. Tente novamente.',
  }
}

export async function createUsageTerm(
  token: string,
  input: CreateUsageTermInput,
): Promise<CreateUsageTermResult> {
  const result = await fetchProtected<UsageTerm>('/api/usage-terms', token, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: 'Erro ao criar termo de uso. Tente novamente.',
  }
}

export async function updateUsageTerm(
  token: string,
  id: string,
  input: UpdateUsageTermInput,
): Promise<UpdateUsageTermResult> {
  const result = await fetchProtected<UsageTerm>(`/api/usage-terms/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 404
      ? 'Termo de uso não encontrado.'
      : result.status === 400
        ? 'Dados inválidos. Verifique os campos.'
        : 'Erro ao atualizar termo de uso. Tente novamente.',
  }
}

export async function activateUsageTerm(
  token: string,
  id: string,
): Promise<ActivateUsageTermResult> {
  const result = await fetchProtected<UsageTerm>(`/api/usage-terms/${id}/activate`, token, {
    method: 'PUT',
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 404
      ? 'Termo de uso não encontrado.'
      : 'Erro ao ativar termo de uso. Tente novamente.',
  }
}

export async function deactivateUsageTerm(
  token: string,
  id: string,
): Promise<DeactivateUsageTermResult> {
  const result = await fetchProtected<UsageTerm>(`/api/usage-terms/${id}/deactivate`, token, {
    method: 'PUT',
  })
  if (result.ok) return { ok: true, data: result.data }
  return {
    ok: false,
    status: result.status,
    message: result.status === 404
      ? 'Termo de uso não encontrado.'
      : 'Erro ao desativar termo de uso. Tente novamente.',
  }
}
