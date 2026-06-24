import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CancelTravelModal from '../components/travel/CancelTravelModal'

afterEach(() => {
  vi.clearAllMocks()
})

describe('CancelTravelModal', () => {
  it('does not render when isOpen=false', () => {
    render(
      <CancelTravelModal
        isOpen={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />,
    )
    expect(screen.queryByText('Cancelar Viagem')).not.toBeInTheDocument()
  })

  it('renders when isOpen=true', () => {
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />,
    )
    expect(screen.getByText('Cancelar Viagem')).toBeInTheDocument()
    expect(screen.getByText('Confirmar Cancelamento')).toBeInTheDocument()
  })

  it('confirm button is disabled when reason is empty', () => {
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />,
    )
    const confirmBtn = screen.getByText('Confirmar Cancelamento')
    expect(confirmBtn).toBeDisabled()
  })

  it('confirm button is enabled when reason is filled', async () => {
    const user = userEvent.setup()
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />,
    )

    const textarea = screen.getByPlaceholderText('Descreva o motivo do cancelamento...')
    await user.type(textarea, 'Motivo de teste')
    expect(screen.getByText('Confirmar Cancelamento')).not.toBeDisabled()
  })

  it('calls onConfirm with reason when submitting', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        loading={false}
      />,
    )

    const textarea = screen.getByPlaceholderText('Descreva o motivo do cancelamento...')
    await user.type(textarea, 'Teste de cancelamento')
    await user.click(screen.getByText('Confirmar Cancelamento'))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('Teste de cancelamento')
    })
  })

  it('calls onCancel when clicking Cancel button', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        loading={false}
      />,
    )

    await user.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('displays error message when error prop is provided', () => {
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
        error="Erro de validação"
      />,
    )
    expect(screen.getByText('Erro de validação')).toBeInTheDocument()
  })

  it('closes on Escape key', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        loading={false}
      />,
    )

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state on confirm button', () => {
    render(
      <CancelTravelModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />,
    )
    expect(screen.getByText('Cancelando...')).toBeInTheDocument()
  })
})
