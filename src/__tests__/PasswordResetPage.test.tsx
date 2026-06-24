import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import PasswordResetPage from '../pages/PasswordResetPage'

function renderResetPage() {
  return render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <AuthProvider>
        <PasswordResetPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('PasswordResetPage - request step', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.restoreAllMocks())

  it('renders email field and send-code button in initial state', () => {
    renderResetPage()

    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument()
  })

  it('shows validation error when email is empty on send', async () => {
    const user = userEvent.setup()
    renderResetPage()

    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    expect(screen.getByText(/preencha o e-mail/i)).toBeInTheDocument()
  })

  it('calls reset request API with email and transitions to confirm step on 202', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) }))

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Código de Verificação')).toBeInTheDocument()
    })
  })

  it('shows generic success state even when email is not registered (anti-enumeration)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) }))

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'notregistered@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Código de Verificação')).toBeInTheDocument()
    })
  })

  it('shows rate-limit error on 429 without revealing account info', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) }))

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(screen.getByText(/muitas tentativas/i)).toBeInTheDocument()
    })
  })
})

describe('PasswordResetPage - confirm step', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.restoreAllMocks())

  async function reachConfirmStep() {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) }))
    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => screen.getByPlaceholderText('Código de Verificação'))

    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    return user
  }

  it('renders code, new-password and confirm-password fields', async () => {
    await reachConfirmStep()

    expect(screen.getByPlaceholderText('Código de Verificação')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nova Senha')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirmar Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
  })

  it('shows validation error when passwords do not match', async () => {
    const user = await reachConfirmStep()

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '123456')
    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'DifferentPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
  })

  it('calls confirm API with email, code, and new password on valid submission', async () => {
    const user = await reachConfirmStep()
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '654321')
    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/password-reset/confirm'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', code: '654321', newPassword: 'NewPass1!' }),
        }),
      )
    })
  })

  it('shows success message after successful password reset', async () => {
    const user = await reachConfirmStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) }))

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '654321')
    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/senha redefinida/i)).toBeInTheDocument()
    })
  })

  it('shows error when code is invalid or expired (400)', async () => {
    const user = await reachConfirmStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid or expired code.' }),
    }))

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '000000')
    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired code/i)).toBeInTheDocument()
    })
  })

  it('shows error when code was already used (409)', async () => {
    const user = await reachConfirmStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({}),
    }))

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '111111')
    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/código já foi utilizado/i)).toBeInTheDocument()
    })
  })
})
