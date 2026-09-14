import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import LoginPage from '../pages/LoginPage'

function renderLoginPage(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('renders email and password fields with sign-in button', () => {
    renderLoginPage()

    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('renders forgot-password link', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: /esqueci minha senha/i })).toBeInTheDocument()
  })

  it('keeps sign-in button disabled until email and password are filled', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    const button = screen.getByRole('button', { name: /entrar/i })
    expect(button).toBeDisabled()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    expect(button).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Senha'), 'secret123')
    expect(button).toBeEnabled()
  })

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'invalid-email')
    await user.type(screen.getByPlaceholderText('Senha'), 'somepassword')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument()
  })

  it('keeps sign-in button disabled when password is empty', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')

    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled()
  })

  it('calls sign-in API with trimmed email and password', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'tok123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: 'user-1',
        roles: ['GlobalAdmin'],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), '  user@example.com  ')
    await user.type(screen.getByPlaceholderText('Senha'), 'secret123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/sign-in'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', password: 'secret123' }),
        }),
      )
    })
  })

  it('stores access token in sessionStorage after successful sign-in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'tok-abc',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: 'user-1',
        roles: ['GlobalAdmin'],
      }),
    }))

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'secret123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(sessionStorage.getItem('moto_admin_token')).toBe('tok-abc')
    })
  })

  it('shows a safe generic error on 401 (invalid credentials)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    }))

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'wrong')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/e-mail ou senha inválidos/i)).toBeInTheDocument()
    })
  })

  it('shows generic error on 429 (rate limited)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({}),
    }))

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'wrong')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/muitas tentativas/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while request is in flight', async () => {
    let resolveRequest!: (v: unknown) => void
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(
      new Promise(res => { resolveRequest = res }),
    ))

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'secret')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled()

    resolveRequest({ ok: false, status: 401, json: async () => ({}) })
  })
})
