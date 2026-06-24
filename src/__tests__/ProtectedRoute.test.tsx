import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

function renderWithAuth(token: string | null, role?: string) {
  if (token) {
    sessionStorage.setItem('moto_admin_token', token)
    sessionStorage.setItem(
      'moto_admin_user',
      JSON.stringify({ userId: 'u1', roles: role ? [role] : [] }),
    )
  }

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/forbidden" element={<div>Forbidden</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('redirects to /login when no token is present', () => {
    renderWithAuth(null)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders protected content when valid token is present', () => {
    renderWithAuth('valid-token', 'GlobalAdmin')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})

describe('ProtectedRoute - role enforcement', () => {
  afterEach(() => sessionStorage.clear())

  function renderWithRole(requiredRole: string, userRole: string | undefined) {
    if (userRole !== undefined) {
      sessionStorage.setItem('moto_admin_token', 'tok')
      sessionStorage.setItem(
        'moto_admin_user',
        JSON.stringify({ userId: 'u1', roles: [userRole] }),
      )
    }

    return render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute requiredRole={requiredRole} />}>
              <Route path="/global-admin" element={<div>GlobalAdmin Content</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/forbidden" element={<div>Forbidden</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it('shows content when user has the required role', () => {
    renderWithRole('GlobalAdmin', 'GlobalAdmin')
    expect(screen.getByText('GlobalAdmin Content')).toBeInTheDocument()
  })

  it('allows GlobalAdmin users through Admin-protected routes', () => {
    renderWithRole('Admin', 'GlobalAdmin')
    expect(screen.getByText('GlobalAdmin Content')).toBeInTheDocument()
  })

  it('shows forbidden when user lacks required role', () => {
    renderWithRole('GlobalAdmin', 'Passenger')
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
  })

  it('shows forbidden when Admin users access GlobalAdmin-only routes', () => {
    renderWithRole('GlobalAdmin', 'Admin')
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
  })

  it('redirects to login when no token and role is required', () => {
    renderWithRole('GlobalAdmin', undefined)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
