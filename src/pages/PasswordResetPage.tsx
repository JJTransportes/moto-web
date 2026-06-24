import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import AppButton from '../components/AppButton'
import { requestPasswordReset, confirmPasswordReset } from '../api/authApi'
import styles from './PasswordResetPage.module.css'

type Step = 'request' | 'confirm' | 'success'

interface RequestErrors {
  email?: string
  general?: string
}

interface ConfirmErrors {
  code?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

function validateRequest(email: string): RequestErrors {
  if (!email.trim()) return { email: 'Preencha o e-mail.' }
  return {}
}

function validateConfirm(code: string, newPassword: string, confirmPassword: string): ConfirmErrors {
  const errors: ConfirmErrors = {}
  if (!code.trim()) errors.code = 'Preencha o código.'
  if (!newPassword) errors.newPassword = 'Preencha a nova senha.'
  if (!confirmPassword) errors.confirmPassword = 'Confirme a senha.'
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Senhas não coincidem.'
  }
  return errors
}

export default function PasswordResetPage() {
  const navigate = useNavigate()

  const [step, setStep]       = useState<Step>('request')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)

  // Request step state
  const [reqErrors, setReqErrors] = useState<RequestErrors>({})

  // Confirm step state
  const [code, setCode]                   = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confErrors, setConfErrors]       = useState<ConfirmErrors>({})

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateRequest(email)
    if (Object.keys(errors).length > 0) { setReqErrors(errors); return }

    setReqErrors({})
    setLoading(true)
    try {
      const result = await requestPasswordReset(email.trim())
      if (result.ok) {
        setStep('confirm')
      } else {
        setReqErrors({ general: result.message })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateConfirm(code, newPassword, confirmPassword)
    if (Object.keys(errors).length > 0) { setConfErrors(errors); return }

    setConfErrors({})
    setLoading(true)
    try {
      const result = await confirmPasswordReset(email, code.trim(), newPassword)
      if (result.ok) {
        setStep('success')
      } else {
        setConfErrors({ general: result.message })
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <AuthCard title={'Recupere\nsua senha'} subtitle="Painel Moto.">
        <div className={styles.successBox}>
          <p className={styles.successText}>Senha redefinida com sucesso!</p>
          <AppButton onClick={() => navigate('/login')}>
            Ir para o login
          </AppButton>
        </div>
      </AuthCard>
    )
  }

  if (step === 'confirm') {
    return (
      <AuthCard title={'Recupere\nsua senha'} subtitle="Painel Moto.">
        <form className={styles.form} onSubmit={handleConfirmSubmit} noValidate>
          <div className={styles.fields}>
            <FormField
              id="code"
              placeholder="Código de Verificação"
              value={code}
              onChange={setCode}
              error={confErrors.code}
              disabled={loading}
            />
            <FormField
              id="newPassword"
              type="password"
              placeholder="Nova Senha"
              value={newPassword}
              onChange={setNewPassword}
              error={confErrors.newPassword}
              disabled={loading}
            />
            <FormField
              id="confirmPassword"
              type="password"
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={confErrors.confirmPassword}
              disabled={loading}
            />
            {confErrors.general && (
              <p className={styles.generalError} role="alert">
                {confErrors.general}
              </p>
            )}
          </div>
          <AppButton type="submit" loading={loading} disabled={loading}>
            Confirmar
          </AppButton>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={'Recupere\nsua senha'} subtitle="Painel Moto.">
      <form className={styles.form} onSubmit={handleRequestSubmit} noValidate>
        <div className={styles.fields}>
          <FormField
            id="email"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            error={reqErrors.email}
            disabled={loading}
          />
          {reqErrors.general && (
            <p className={styles.generalError} role="alert">
              {reqErrors.general}
            </p>
          )}
        </div>
        <AppButton type="submit" loading={loading} disabled={loading}>
          Enviar Código
        </AppButton>
      </form>
    </AuthCard>
  )
}
