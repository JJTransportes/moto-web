import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import AppButton from '../components/AppButton'
import PasswordRequirements from '../components/PasswordRequirements'
import { requestPasswordReset, verifyResetCode, confirmPasswordReset } from '../api/authApi'
import { isPasswordValid, validatePassword } from '../utils/validators'
import styles from './PasswordResetPage.module.css'

type Step = 'request' | 'verify' | 'newPassword' | 'success'

interface RequestErrors {
  email?: string
  confirmEmail?: string
  general?: string
}

interface VerifyErrors {
  code?: string
  general?: string
}

interface NewPasswordErrors {
  newPassword?: string
  confirmPassword?: string
  general?: string
}

const MAX_CODE_ATTEMPTS = 5
const ATTEMPT_WARNING_THRESHOLD = 3

function validateRequest(email: string, confirmEmail: string): RequestErrors {
  const errors: RequestErrors = {}
  if (!email.trim()) errors.email = 'Preencha o e-mail.'
  if (!confirmEmail.trim()) errors.confirmEmail = 'Confirme o e-mail.'
  else if (email.trim() !== confirmEmail.trim()) errors.confirmEmail = 'Os e-mails não coincidem.'
  return errors
}

function validateVerify(code: string): VerifyErrors {
  if (!code.trim()) return { code: 'Preencha o código.' }
  return {}
}

function validateNewPassword(newPassword: string, confirmPassword: string): NewPasswordErrors {
  const errors: NewPasswordErrors = {}
  const passwordError = validatePassword(newPassword)
  if (passwordError) errors.newPassword = passwordError
  if (!confirmPassword) errors.confirmPassword = 'Confirme a senha.'
  else if (newPassword !== confirmPassword) errors.confirmPassword = 'Senhas não coincidem.'
  return errors
}

export default function PasswordResetPage() {
  const navigate = useNavigate()

  const [step, setStep]       = useState<Step>('request')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)

  // Request step state
  const [confirmEmail, setConfirmEmail] = useState('')
  const [reqErrors, setReqErrors]       = useState<RequestErrors>({})

  // Verify-code step state
  const [code, setCode]                     = useState('')
  const [verifyErrors, setVerifyErrors]     = useState<VerifyErrors>({})
  const [failedAttempts, setFailedAttempts] = useState(0)

  // New-password step state
  const [resetToken, setResetToken]           = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [npErrors, setNpErrors]               = useState<NewPasswordErrors>({})

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateRequest(email, confirmEmail)
    if (Object.keys(errors).length > 0) { setReqErrors(errors); return }

    setReqErrors({})
    setLoading(true)
    try {
      const result = await requestPasswordReset(email.trim())
      if (result.ok) {
        setFailedAttempts(0)
        setStep('verify')
      } else {
        setReqErrors({ general: result.message })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateVerify(code)
    if (Object.keys(errors).length > 0) { setVerifyErrors(errors); return }

    setVerifyErrors({})
    setLoading(true)
    try {
      const result = await verifyResetCode(email.trim(), code.trim())
      if (result.ok) {
        setResetToken(result.resetToken)
        setFailedAttempts(0)
        setStep('newPassword')
      } else {
        const attempts = failedAttempts + 1
        setFailedAttempts(attempts)
        const remaining = MAX_CODE_ATTEMPTS - attempts
        const warning =
          attempts >= ATTEMPT_WARNING_THRESHOLD && remaining > 0
            ? ` Restam ${remaining} tentativa${remaining === 1 ? '' : 's'} antes de precisar pedir um novo código.`
            : ''
        setVerifyErrors({ general: `${result.message}${warning}` })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestNewCode() {
    setCode('')
    setVerifyErrors({})
    setFailedAttempts(0)
    setLoading(true)
    try {
      const result = await requestPasswordReset(email.trim())
      if (!result.ok) setVerifyErrors({ general: result.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleNewPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateNewPassword(newPassword, confirmPassword)
    if (Object.keys(errors).length > 0) { setNpErrors(errors); return }

    setNpErrors({})
    setLoading(true)
    try {
      const result = await confirmPasswordReset(resetToken, newPassword)
      if (result.ok) {
        setStep('success')
      } else if (result.status === 400 || result.status === 409) {
        // Token expirado, inválido ou já usado — precisa pedir o código de novo.
        setNpErrors({
          general: `${result.message} Solicite um novo código para continuar.`,
        })
      } else {
        setNpErrors({ general: result.message })
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

  if (step === 'newPassword') {
    return (
      <AuthCard title={'Recupere\nsua senha'} subtitle="Painel Moto.">
        <form className={styles.form} onSubmit={handleNewPasswordSubmit} noValidate>
          <div className={styles.fields}>
            <FormField
              id="newPassword"
              type="password"
              placeholder="Nova Senha"
              value={newPassword}
              onChange={setNewPassword}
              error={npErrors.newPassword}
              disabled={loading}
            />
            <PasswordRequirements password={newPassword} />
            <FormField
              id="confirmPassword"
              type="password"
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={npErrors.confirmPassword}
              disabled={loading}
            />
            {npErrors.general && (
              <p className={styles.generalError} role="alert">
                {npErrors.general}
              </p>
            )}
          </div>
          <AppButton type="submit" loading={loading} disabled={loading || !isPasswordValid(newPassword)}>
            Confirmar
          </AppButton>
        </form>
      </AuthCard>
    )
  }

  if (step === 'verify') {
    return (
      <AuthCard title={'Recupere\nsua senha'} subtitle="Painel Moto.">
        <form className={styles.form} onSubmit={handleVerifySubmit} noValidate>
          <div className={styles.fields}>
            <FormField
              id="code"
              placeholder="Código de Verificação"
              value={code}
              onChange={setCode}
              error={verifyErrors.code}
              disabled={loading}
            />
            {verifyErrors.general && (
              <p className={styles.generalError} role="alert">
                {verifyErrors.general}
              </p>
            )}
            <button
              type="button"
              onClick={handleRequestNewCode}
              disabled={loading}
              className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
            >
              Pedir um novo código
            </button>
          </div>
          <AppButton type="submit" loading={loading} disabled={loading}>
            Confirmar Código
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
            required
            disabled={loading}
          />
          <FormField
            id="confirmEmail"
            type="email"
            placeholder="Confirmar E-mail"
            value={confirmEmail}
            onChange={setConfirmEmail}
            error={reqErrors.confirmEmail}
            required
            disabled={loading}
          />
          {reqErrors.general && (
            <p className={styles.generalError} role="alert">
              {reqErrors.general}
            </p>
          )}
        </div>
        <AppButton
          type="submit"
          loading={loading}
          disabled={loading || !email.trim() || !confirmEmail.trim()}
        >
          Enviar Código
        </AppButton>
      </form>
    </AuthCard>
  )
}
