const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  accessToken: string
  expiresAt: string
  userId: string
  roles: string[]
}

export interface ApiError {
  error: string
}

export type SignInResult =
  | { ok: true; data: SignInResponse }
  | { ok: false; status: number; message: string }

export type PasswordResetRequestResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

export type PasswordResetConfirmResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

export async function signIn(req: SignInRequest): Promise<SignInResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    if (res.ok) {
      const data = (await res.json()) as SignInResponse
      return { ok: true, data }
    }

    const message = await extractMessage(res)
    return { ok: false, status: res.status, message }
  } catch {
    return { ok: false, status: 0, message: 'Erro de conexão. Tente novamente.' }
  }
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.status === 202 || res.ok) return { ok: true }

    const message = await extractMessage(res)
    return { ok: false, status: res.status, message }
  } catch {
    return { ok: false, status: 0, message: 'Erro de conexão. Tente novamente.' }
  }
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<PasswordResetConfirmResult> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    })

    if (res.ok) return { ok: true }

    const message = await extractMessage(res)
    return { ok: false, status: res.status, message }
  } catch {
    return { ok: false, status: 0, message: 'Erro de conexão. Tente novamente.' }
  }
}

async function extractMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError
    if (body.error) return body.error
  } catch {
    // fall through
  }

  switch (res.status) {
    case 400: return 'Dados inválidos. Verifique os campos e tente novamente.'
    case 401: return 'E-mail ou senha inválidos.'
    case 409: return 'O código já foi utilizado.'
    case 429: return 'Muitas tentativas. Aguarde um momento e tente novamente.'
    default:  return 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  }
}

export async function fetchProtected<T>(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (res.ok) {
      const text = await res.text()
      const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T)
      return { ok: true, data }
    }
    return { ok: false, status: res.status }
  } catch {
    return { ok: false, status: 0 }
  }
}
