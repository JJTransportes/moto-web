import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TravelStatusBadge from '../components/travel/TravelStatusBadge'
import type { TravelStatus } from '../types/travel'

describe('TravelStatusBadge', () => {
  const cases: { status: TravelStatus; label: string; className: string }[] = [
    { status: 'Pending', label: 'Pendente', className: 'bg-yellow-100' },
    { status: 'Accepted', label: 'Aceita', className: 'bg-blue-100' },
    { status: 'InProgress', label: 'Em Andamento', className: 'bg-green-100' },
    { status: 'Completed', label: 'Concluída', className: 'bg-gray-100' },
    { status: 'Cancelled', label: 'Cancelada', className: 'bg-red-100' },
  ]

  it.each(cases)('renders "$label" for status $status', ({ status, label }) => {
    render(<TravelStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each(cases)('applies correct color class for $status', ({ status, className }) => {
    render(<TravelStatusBadge status={status} />)
    const span = screen.getByText(cases.find(c => c.status === status)!.label)
    expect(span.className).toContain(className)
  })
})
