import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import {
  afterEach,
  describe,
  expect,
  it
} from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { BrandImageProvider } from '../auth/BrandImageContext'
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
        <BrandImageProvider>
          <Sidebar />
        </BrandImageProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  sessionStorage.clear()
})

describe('Sidebar — sign-out button', () => {
  it('renders a "Sair" button when authenticated', () => {
    renderSidebar(['GlobalAdmin'])
    const sairButton = screen.getByRole('button', { name: /sair/i })
    expect(sairButton).toBeInTheDocument()
  })

  it('renders as a <button> element, not a link', () => {
    renderSidebar(['GlobalAdmin'])
    const sairButton = screen.getByRole('button', { name: /sair/i })
    expect(sairButton.tagName).toBe('BUTTON')
    expect(sairButton).not.toHaveAttribute('href')
  })

  it('shows the LogOut icon', () => {
    renderSidebar(['GlobalAdmin'])
    // The button contains an SVG icon (LogOut from lucide-react)
    const sairButton = screen.getByRole('button', { name: /sair/i })
    const svg = sairButton.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('clears session storage on click', async () => {
    const user = userEvent.setup()
    renderSidebar(['GlobalAdmin'])

    expect(sessionStorage.getItem('moto_admin_token')).toBe('fake-token')

    const sairButton = screen.getByRole('button', { name: /sair/i })
    await user.click(sairButton)

    expect(sessionStorage.getItem('moto_admin_token')).toBeNull()
    expect(sessionStorage.getItem('moto_admin_user')).toBeNull()
  })
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
