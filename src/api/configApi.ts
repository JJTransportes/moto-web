const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export interface BrandImageResponse {
  fileId: string
  filename: string
  mimeType: string
}

export async function fetchBrandImageUrl(): Promise<
  { ok: true; url: string } | { ok: false }
> {
  try {
    const res = await fetch(`${BASE_URL}/api/config/brand-image`)
    if (!res.ok) return { ok: false }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    return { ok: true, url }
  } catch {
    return { ok: false }
  }
}

export async function uploadBrandImage(
  token: string,
  file: File,
): Promise<
  | { ok: true; data: BrandImageResponse }
  | { ok: false; status: number; message: string }
> {
  try {
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`${BASE_URL}/api/config/brand-image`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    if (res.ok) {
      const data = (await res.json()) as BrandImageResponse
      return { ok: true, data }
    }

    const message = await extractMessage(res)
    return { ok: false, status: res.status, message }
  } catch {
    return { ok: false, status: 0, message: 'Erro de conexão. Tente novamente.' }
  }
}

async function extractMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error: string }
    if (body.error) return body.error
  } catch { /* fall through */ }
  switch (res.status) {
    case 400: return 'Dados inválidos. Verifique o arquivo e tente novamente.'
    case 401: return 'Sessão expirada. Faça login novamente.'
    case 403: return 'Apenas administradores globais podem alterar a marca.'
    case 413: return 'O arquivo é muito grande. O limite é 10 MB.'
    default: return 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  }
}
