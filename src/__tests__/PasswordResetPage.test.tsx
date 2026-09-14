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
    expect(screen.getByPlaceholderText('Confirmar E-mail')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument()
  })

  it('keeps send-code button disabled until both email fields are filled', async () => {
    const user = userEvent.setup()
    renderResetPage()

    const button = screen.getByRole('button', { name: /enviar código/i })
    expect(button).toBeDisabled()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    expect(button).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    expect(button).toBeEnabled()
  })

  it('shows validation error when confirm-email is empty on send', async () => {
    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    await user.clear(screen.getByPlaceholderText('Confirmar E-mail'))
    await user.click(screen.getByPlaceholderText('E-mail'))

    expect(screen.getByRole('button', { name: /enviar código/i })).toBeDisabled()
  })

  it('shows validation error when emails do not match', async () => {
    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'other@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    expect(screen.getByText(/e-mails não coincidem/i)).toBeInTheDocument()
  })

  it('calls reset request API with email and transitions to verify step on 202', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) }))

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Código de Verificação')).toBeInTheDocument()
    })
  })

  it('sends expectedRole alongside the email on request', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/password-reset/request'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', expectedRole: 'GlobalAdmin' }),
        }),
      )
    })
  })

  it('shows "Email não cadastrado." when the email does not exist (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Email não cadastrado.' }),
    }))

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'notregistered@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'notregistered@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(screen.getByText(/email não cadastrado/i)).toBeInTheDocument()
    })
    expect(screen.queryByPlaceholderText('Código de Verificação')).not.toBeInTheDocument()
  })

  it('shows rate-limit error on 429 without revealing account info', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) }))

    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(screen.getByText(/muitas tentativas/i)).toBeInTheDocument()
    })
  })
})

describe('PasswordResetPage - verify-code step', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.restoreAllMocks())

  async function reachVerifyStep() {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) }))
    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => screen.getByPlaceholderText('Código de Verificação'))

    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    return user
  }

  it('renders code field and confirm-code button', async () => {
    await reachVerifyStep()

    expect(screen.getByPlaceholderText('Código de Verificação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar código/i })).toBeInTheDocument()
  })

  it('calls verify-code API with email and code, and advances to new-password step on success', async () => {
    const user = await reachVerifyStep()
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resetToken: 'token-abc' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '654321')
    await user.click(screen.getByRole('button', { name: /confirmar código/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/password-reset/verify-code'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', code: '654321' }),
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nova Senha')).toBeInTheDocument()
    })
  })

  it('shows error and remaining-attempts warning when code is invalid (400)', async () => {
    const user = await reachVerifyStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid or expired code.' }),
    }))

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '000000')
    await user.click(screen.getByRole('button', { name: /confirmar código/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired code/i)).toBeInTheDocument()
    })
  })

  it('shows lockout message on 429', async () => {
    const user = await reachVerifyStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) }))

    await user.type(screen.getByPlaceholderText('Código de Verificação'), '999999')
    await user.click(screen.getByRole('button', { name: /confirmar código/i }))

    await waitFor(() => {
      expect(screen.getByText(/muitas tentativas/i)).toBeInTheDocument()
    })
  })
})

describe('PasswordResetPage - new-password step', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.restoreAllMocks())

  async function reachNewPasswordStep() {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({}) }))
    const user = userEvent.setup()
    renderResetPage()

    await user.type(screen.getByPlaceholderText('E-mail'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Confirmar E-mail'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))
    await waitFor(() => screen.getByPlaceholderText('Código de Verificação'))

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resetToken: 'token-abc' }),
    }))
    await user.type(screen.getByPlaceholderText('Código de Verificação'), '654321')
    await user.click(screen.getByRole('button', { name: /confirmar código/i }))
    await waitFor(() => screen.getByPlaceholderText('Nova Senha'))

    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    return user
  }

  it('renders new-password and confirm-password fields with the requirements checklist', async () => {
    await reachNewPasswordStep()

    expect(screen.getByPlaceholderText('Nova Senha')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirmar Senha')).toBeInTheDocument()
    expect(screen.getByText(/a senha deve conter/i)).toBeInTheDocument()
  })

  it('shows validation error when passwords do not match', async () => {
    const user = await reachNewPasswordStep()

    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'DifferentPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
  })

  it('keeps submit disabled while password does not meet the strength policy', async () => {
    const user = await reachNewPasswordStep()

    await user.type(screen.getByPlaceholderText('Nova Senha'), 'weak')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'weak')

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled()
  })

  it('calls confirm API with resetToken and new password on valid submission', async () => {
    const user = await reachNewPasswordStep()
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)

    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/password-reset/confirm'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ resetToken: 'token-abc', newPassword: 'NewPass1!' }),
        }),
      )
    })
  })

  it('shows success message after successful password reset', async () => {
    const user = await reachNewPasswordStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) }))

    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/senha redefinida/i)).toBeInTheDocument()
    })
  })

  it('shows error prompting to restart when token is expired or invalid (400)', async () => {
    const user = await reachNewPasswordStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid or expired token.' }),
    }))

    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument()
      expect(screen.getByText(/solicite um novo código/i)).toBeInTheDocument()
    })
  })

  it('shows error when token was already used (409)', async () => {
    const user = await reachNewPasswordStep()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({}),
    }))

    await user.type(screen.getByPlaceholderText('Nova Senha'), 'NewPass1!')
    await user.type(screen.getByPlaceholderText('Confirmar Senha'), 'NewPass1!')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/código já foi utilizado/i)).toBeInTheDocument()
    })
  })
})
