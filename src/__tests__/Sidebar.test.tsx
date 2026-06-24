import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import Sidebar from '../components/Sidebar'

function renderSidebar(roles: string[], initialEntries: string[] = ['/']) {
  sessionStorage.setItem('moto_admin_token', 'fake-token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles }),
  )

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  sessionStorage.clear()
})

describe('Sidebar — GlobalAdmin role', () => {
  it('shows all creation links', () => {
    renderSidebar(['GlobalAdmin'])
    const usuariosElements = screen.getAllByText('Usuários')
    expect(usuariosElements.length).toBeGreaterThanOrEqual(2) // section heading + nav link
    expect(screen.getByText('Novo Passageiro')).toBeInTheDocument()
    expect(screen.getByText('Novo Motorista')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('shows Usuários nav link', () => {
    renderSidebar(['GlobalAdmin'])
    const links = screen.getAllByRole('link')
    const usuariosLink = links.find(link => link.getAttribute('href') === '/users')
    expect(usuariosLink).toBeDefined()
    expect(usuariosLink!.textContent).toContain('Usuários')
  })

  it('shows partitions section', () => {
    renderSidebar(['GlobalAdmin'])
    expect(screen.getByText('Unidades')).toBeInTheDocument()
    expect(screen.getByText('Unidades Públicas')).toBeInTheDocument()
  })
})

describe('Sidebar — Passenger role', () => {
  it('shows no user creation links', () => {
    renderSidebar(['Passenger'])
    expect(screen.queryAllByText('Usuários').length).toBe(0)
    expect(screen.queryByText('Novo Passageiro')).not.toBeInTheDocument()
    expect(screen.queryByText('Novo Motorista')).not.toBeInTheDocument()
    expect(screen.queryByText('Configurações')).toBeInTheDocument()
  })
})
