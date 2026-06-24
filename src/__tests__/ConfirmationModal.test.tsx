import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmationModal from '../components/ConfirmationModal'

function renderModal(
  overrides: Partial<React.ComponentProps<typeof ConfirmationModal>> = {},
) {
  const defaults = {
    isOpen: true,
    title: 'Confirmar ação',
    description: 'Insira o código do administrador para prosseguir.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
    error: undefined,
  }

  return {
    ...render(<ConfirmationModal {...defaults} {...overrides} />),
    onConfirm: (overrides.onConfirm ?? defaults.onConfirm) as ReturnType<typeof vi.fn>,
    onCancel: (overrides.onCancel ?? defaults.onCancel) as ReturnType<typeof vi.fn>,
  }
}

describe('ConfirmationModal', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the modal when isOpen is true', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirmar ação')).toBeInTheDocument()
  })

  it('calls onConfirm with the entered admin code on submit', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderModal({ onConfirm })

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'my-admin-code')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onConfirm).toHaveBeenCalledWith('my-admin-code')
  })

  it('disables the Confirm button when admin code is empty', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderModal({ onCancel })

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('displays an error message when error prop is provided', () => {
    renderModal({ error: 'Código inválido.' })
    expect(screen.getByRole('alert')).toHaveTextContent('Código inválido.')
  })

  it('shows loading state and disables buttons during submission', () => {
    renderModal({ loading: true })
    expect(screen.getByRole('button', { name: 'Aguarde...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
