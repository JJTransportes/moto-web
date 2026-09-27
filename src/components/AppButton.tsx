import styles from './AppButton.module.css'
import type { ReactNode } from 'react'

interface AppButtonProps {
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  children: ReactNode
}

export default function AppButton({
  type = 'button',
  onClick,
  disabled,
  loading,
  children,
}: AppButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={styles.button}
      aria-busy={loading || undefined}
    >
      {children}
    </button>
  )
}
