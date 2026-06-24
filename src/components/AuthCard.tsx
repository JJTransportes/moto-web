import styles from './AuthCard.module.css'
import type { ReactNode } from 'react'
import { useBrandImage } from '../auth/BrandImageContext'

const logoUrl = 'https://www.figma.com/api/mcp/asset/47d4d395-5085-4803-9fe5-88c686b616d3'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

function BrandImage() {
  const { brandImageUrl, isLoading } = useBrandImage()

  if (isLoading) {
    return <div className={`${styles.logo} animate-pulse rounded bg-slate-200`} />
  }

  const src = brandImageUrl ?? logoUrl
  return (
    <img
      src={src}
      alt="Brand"
      className={styles.logo}
      onError={(e) => {
        if (brandImageUrl) {
          (e.target as HTMLImageElement).src = logoUrl
        }
      }}
    />
  )
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.heading}>
          <BrandImage />
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
