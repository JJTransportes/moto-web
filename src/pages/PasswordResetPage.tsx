import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import AppButton from '../components/AppButton'
import PasswordRequirements from '../components/PasswordRequirements'
import { requestPasswordReset, verifyResetCode, confirmPasswordReset } from '../api/authApi'
import { isPasswordValid, validatePassword } from '../utils/validators'
import { useServerErrorGuard } from '../hooks/useServerErrorGuard'
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
  const requestGuard = useServerErrorGuard()

  // Verify-code step state
  const [code, setCode]                     = useState('')
  const [verifyErrors, setVerifyErrors]     = useState<VerifyErrors>({})
  const [failedAttempts, setFailedAttempts] = useState(0)
  const verifyGuard = useServerErrorGuard()

  // New-password step state
  const [resetToken, setResetToken]           = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [npErrors, setNpErrors]               = useState<NewPasswordErrors>({})
  const npGuard = useServerErrorGuard()

  function handleEmailChange(value: string) {
    setEmail(value)
    requestGuard.onFieldChange('email', value)
  }

  function handleCodeChange(value: string) {
    setCode(value)
    verifyGuard.onFieldChange('code', value)
  }

  function handleNewPasswordChange(value: string) {
    setNewPassword(value)
    npGuard.onFieldChange('newPassword', value)
  }

  useEffect(() => {
    if (!requestGuard.isBlocked) setReqErrors(prev => (prev.general ? { ...prev, general: undefined } : prev))
  }, [requestGuard.isBlocked])

  useEffect(() => {
    if (!verifyGuard.isBlocked) setVerifyErrors(prev => (prev.general ? { ...prev, general: undefined } : prev))
  }, [verifyGuard.isBlocked])

  useEffect(() => {
    if (!npGuard.isBlocked) setNpErrors(prev => (prev.general ? { ...prev, general: undefined } : prev))
  }, [npGuard.isBlocked])

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
        requestGuard.block('email', { email }, result.message)
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
        const message = `${result.message}${warning}`
        setVerifyErrors({ general: message })
        verifyGuard.block('code', { code }, message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestNewCode() {
    setCode('')
    setVerifyErrors({})
    setFailedAttempts(0)
    verifyGuard.clear()
    setLoading(true)
    try {
      const result = await requestPasswordReset(email.trim())
      if (!result.ok) {
        setVerifyErrors({ general: result.message })
        verifyGuard.block('code', { code: '' }, result.message)
      }
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
        const message = `${result.message} Solicite um novo código para continuar.`
        setNpErrors({ general: message })
        npGuard.block('newPassword', { newPassword }, message)
      } else {
        setNpErrors({ general: result.message })
        npGuard.block('newPassword', { newPassword }, result.message)
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
              onChange={handleNewPasswordChange}
              error={npErrors.newPassword ?? npGuard.errorFor('newPassword')}
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
          <AppButton
            type="submit"
            loading={loading}
            disabled={loading || !isPasswordValid(newPassword) || npGuard.isBlocked}
          >
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
              onChange={handleCodeChange}
              error={verifyErrors.code ?? verifyGuard.errorFor('code')}
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
          <AppButton type="submit" loading={loading} disabled={loading || verifyGuard.isBlocked}>
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
            onChange={handleEmailChange}
            error={reqErrors.email ?? requestGuard.errorFor('email')}
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
          disabled={loading || !email.trim() || !confirmEmail.trim() || requestGuard.isBlocked}
        >
          Enviar Código
        </AppButton>
      </form>
    </AuthCard>
  )
}
