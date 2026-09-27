import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import UserAvatar from '../components/UserAvatar'

// WEB-09 seguiu de quebra: UserAvatar agora lê o token via `useAuth()` pra
// buscar `/api/files/{id}` autenticado — precisa de um AuthProvider por
// perto mesmo nesses testes que só usam URLs absolutas (sem fetch real).
function renderAvatar(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('UserAvatar', () => {
  it('renders an img when photoUrl is provided', () => {
    renderAvatar(
      <UserAvatar photoUrl="https://example.com/photo.jpg" fullName="João Silva" />,
    )
    const img = screen.getByRole('img', { name: 'João Silva' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveClass('object-cover')
  })

  it('renders initials fallback when photoUrl is null', () => {
    renderAvatar(<UserAvatar photoUrl={null} fullName="Maria Souza" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('MS')).toBeInTheDocument()
  })

  it('renders initials fallback when photoUrl is undefined', () => {
    renderAvatar(<UserAvatar photoUrl={undefined} fullName="Carlos Pereira" />)
    expect(screen.getByText('CP')).toBeInTheDocument()
  })

  it('renders single initial for one-word name', () => {
    renderAvatar(<UserAvatar photoUrl={null} fullName="João" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders "?" for empty name', () => {
    renderAvatar(<UserAvatar photoUrl={null} fullName="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders first and last initial for multi-word names', () => {
    renderAvatar(<UserAvatar photoUrl={null} fullName="João Carlos da Silva" />)
    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('shows initials when image fails to load', () => {
    renderAvatar(
      <UserAvatar photoUrl="https://example.com/broken.jpg" fullName="Ana Costa" />,
    )
    const img = screen.getByRole('img', { name: 'Ana Costa' })
    expect(img).toBeInTheDocument()

    // Simulate image load error (wrapped in act for state update)
    act(() => {
      img.dispatchEvent(new Event('error'))
    })

    // After error, the img should be gone and initials shown
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('AC')).toBeInTheDocument()
  })

  it('applies sm size class', () => {
    const { container } = renderAvatar(
      <UserAvatar photoUrl={null} fullName="Test" size="sm" />,
    )
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('h-8')
    expect(avatar.className).toContain('w-8')
  })

  it('applies md size class by default', () => {
    const { container } = renderAvatar(
      <UserAvatar photoUrl={null} fullName="Test" />,
    )
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('h-12')
    expect(avatar.className).toContain('w-12')
  })

  it('applies lg size class', () => {
    const { container } = renderAvatar(
      <UserAvatar photoUrl={null} fullName="Test" size="lg" />,
    )
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('h-20')
    expect(avatar.className).toContain('w-20')
  })

  it('applies additional className', () => {
    const { container } = renderAvatar(
      <UserAvatar photoUrl={null} fullName="Test" className="ring-2 ring-blue-500" />,
    )
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('ring-2')
    expect(avatar.className).toContain('ring-blue-500')
  })
})
