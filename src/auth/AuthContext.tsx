import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

const TOKEN_KEY = 'moto_admin_token'
const USER_KEY  = 'moto_admin_user'

export interface AuthUser {
  userId: string
  roles: string[]
}

type AppRole = 'GlobalAdmin' | 'Passenger' | 'Driver'

const ROLE_SATISFIERS: Readonly<Record<string, readonly AppRole[]>> = {
  GlobalAdmin: ['GlobalAdmin'],
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  signIn: (token: string, user: AuthUser) => void
  signOut: () => void
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  hasMinimumRole: (requiredRole: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredAuth(): { token: string | null; user: AuthUser | null } {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const raw   = sessionStorage.getItem(USER_KEY)
    if (token && raw) {
      const user = JSON.parse(raw) as AuthUser
      return { token, user }
    }
  } catch {
    // ignore corrupt storage
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = useMemo(() => loadStoredAuth(), [])
  const [token, setToken] = useState<string | null>(stored.token)
  const [user,  setUser]  = useState<AuthUser | null>(stored.user)

  const signIn = useCallback((newToken: string, newUser: AuthUser) => {
    sessionStorage.setItem(TOKEN_KEY, newToken)
    sessionStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (role: string) => user?.roles.includes(role) ?? false,
    [user],
  )

  const hasMinimumRole = useCallback(
    (requiredRole: string) => {
      const satisfiers = ROLE_SATISFIERS[requiredRole]
      return satisfiers?.some(role => user?.roles.includes(role)) ?? false
    },
    [user],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      signIn,
      signOut,
      isAuthenticated: token !== null,
      hasRole,
      hasMinimumRole,
    }),
    [token, user, signIn, signOut, hasRole, hasMinimumRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
