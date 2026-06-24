import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth/AuthContext'

function RoleProbe({ requiredRole }: { requiredRole: string }) {
  const { hasMinimumRole } = useAuth()

  return <span>{String(hasMinimumRole(requiredRole))}</span>
}

function renderProbe(roles: string[], requiredRole: string) {
  sessionStorage.setItem('moto_admin_token', 'token')
  sessionStorage.setItem(
    'moto_admin_user',
    JSON.stringify({ userId: 'user-1', roles }),
  )

  return render(
    <AuthProvider>
      <RoleProbe requiredRole={requiredRole} />
    </AuthProvider>,
  )
}

describe('AuthContext role hierarchy', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('treats GlobalAdmin as satisfied by the GlobalAdmin role', () => {
    renderProbe(['GlobalAdmin'], 'Admin')
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('treats Admin as satisfied by the GlobalAdmin role', () => {
    renderProbe(['GlobalAdmin'], 'Admin')
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('does not treat GlobalAdmin as satisfied by the Admin role', () => {
    renderProbe(['GlobalAdmin'], 'GlobalAdmin')
    expect(screen.getByText('false')).toBeInTheDocument()
  })

  it('returns false for unknown required roles', () => {
    renderProbe(['GlobalAdmin'], 'Unknown')
    expect(screen.getByText('false')).toBeInTheDocument()
  })
})
