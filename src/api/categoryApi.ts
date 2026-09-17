import { fetchProtected } from './authApi'

export interface CategorySummary {
  categoryId: string
  title: string
  description: string | null
}

export interface CreateCategoryInput {
  title: string
  description?: string | null
  adminCode: string
}

export interface CategoryDetail extends CategorySummary {
  partitionIds: string[]
  partitionNames: string[]
  createdAt: string
  updatedAt: string
}

export type ListCategoriesResult =
  | { ok: true; data: CategorySummary[] }
  | { ok: false; status: number; message: string }

export type CreateCategoryResult =
  | { ok: true; data: CategoryDetail }
  | { ok: false; status: number; message: string }

export async function listCategories(token: string): Promise<ListCategoriesResult> {
  const result = await fetchProtected<CategorySummary[]>('/api/categories', token)
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: 'Erro ao carregar categorias. Tente novamente.' }
}

export async function createCategory(token: string, input: CreateCategoryInput): Promise<CreateCategoryResult> {
  const result = await fetchProtected<CategoryDetail>('/api/categories', token, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (result.ok) return { ok: true, data: result.data }
  return { ok: false, status: result.status, message: result.apiMessage ?? 'Erro ao criar categoria. Tente novamente.' }
}
