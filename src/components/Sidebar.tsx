import { Building2, Car, FileText, ListStart, LogOut, Route, Settings, Users } from 'lucide-react'
import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useBrandImage } from '../auth/BrandImageContext'

interface SidebarIconProps {
  className?: string
}

function HomeIcon({ className }: SidebarIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M3 10.75 12 3l9 7.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 9.75V21h10.5V9.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PassengerIcon({ className }: SidebarIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 12a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DriverIcon({ className }: SidebarIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7.25" />
      <path d="M12 12V4.75" strokeLinecap="round" />
      <path d="M16.75 16.75 12 12" strokeLinecap="round" />
      <path d="M4.75 12H12" strokeLinecap="round" />
    </svg>
  )
}

interface SidebarNavLinkProps {
  to: string
  label: string
  end?: boolean
  icon: (props: SidebarIconProps) => ReactNode
}

function SidebarNavLink({ to, label, end = false, icon: Icon }: SidebarNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `mo-focus flex min-h-12 w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold transition-all ${isActive
          ? 'bg-cobalto text-white shadow-moto before:h-5 before:w-1 before:rounded-full before:bg-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-cobalto'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-tertiary)]'}`} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

export default function Sidebar() {
  const { hasMinimumRole, signOut } = useAuth()
  const isGlobalAdmin = hasMinimumRole('GlobalAdmin')

  // Sem navigate() manual aqui de propósito: chamar `navigate('/login')` ao
  // mesmo tempo que `signOut()` muda `isAuthenticated` cria uma corrida com
  // o redirecionamento declarativo do `ProtectedRoute` (que também reage à
  // mesma mudança de estado) — os dois mexendo no histórico do React Router
  // quase juntos deixava a URL mudar sem a árvore de rotas acompanhar.
  // `ProtectedRoute` já cuida do redirecionamento sozinho.
  function handleSignOut() {
    signOut()
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--border-default)] bg-white/90 px-4 py-6 shadow-[var(--shadow-1)]">
      <SidebarBranding />

      <nav className="flex flex-1 flex-col gap-4">
        <SidebarNavLink to="/" end label="Dashboard" icon={HomeIcon} />

        {isGlobalAdmin && (
          <SidebarSection label="Usuários">
            <SidebarNavLink to="/users" label="Usuários" icon={Users} />
            <SidebarNavLink to="/users/passengers/new" label="Novo Passageiro" icon={PassengerIcon} />
            <SidebarNavLink to="/users/drivers/new" label="Novo Motorista" icon={DriverIcon} />
          </SidebarSection>
        )}

        {isGlobalAdmin && (
          <SidebarSection label="Secretarias">
            <SidebarNavLink to="/partitions" label="Secretarias" icon={Building2} />
          </SidebarSection>
        )}

        <SidebarNavLink to="/fleets" label="Frotas" icon={Car} />
        <SidebarNavLink to="/routes" label="Corridas" icon={Route} />
        {isGlobalAdmin && (
          <SidebarNavLink to="/reports" label="Relatórios" icon={ListStart} />
        )}
        {isGlobalAdmin && (
          <SidebarNavLink to="/usage-terms" label="Termos de Uso" icon={FileText} />
        )}
        <SidebarNavLink to="/settings" label="Configurações" icon={Settings} />
      </nav>

      <hr className="my-2 border-slate-200" />

      <button
        type="button"
        onClick={handleSignOut}
        className="mo-focus flex min-h-12 w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold text-[var(--text-tertiary)] transition-colors hover:bg-red-50 hover:text-[var(--danger)]"
      >
        <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
        <span>Sair</span>
      </button>
    </aside>
  )
}

function SidebarBranding() {
  const { brandImageUrl, isLoading } = useBrandImage()

  if (isLoading) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    )
  }

  if (brandImageUrl) {
    return (
      <div className="mb-8 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <img
          src={brandImageUrl}
          alt="Brand"
          className="max-h-12 w-auto object-contain"
        />
      </div>
    )
  }

  // Fallback to hardcoded branding
  return (
    <div className="mo-surface mb-8 flex items-center gap-3 px-3 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cobalto font-display text-lg font-bold text-white shadow-moto">
        M
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Moto</p>
        <p className="truncate text-base font-semibold text-slate-900">Moto</p>
      </div>
    </div>
  )
}
