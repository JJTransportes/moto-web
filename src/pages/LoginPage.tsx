import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import AppButton from '../components/AppButton'
import { useAuth } from '../auth/AuthContext'
import { signIn } from '../api/authApi'
import styles from './LoginPage.module.css'

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email.trim()) {
    errors.email = 'Preencha o e-mail.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'E-mail inválido.'
  }
  if (!password) {
    errors.password = 'Preencha a senha.'
  }
  return errors
}

export default function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors]     = useState<FormErrors>({})
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationErrors = validate(email, password)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const result = await signIn({ email: email.trim(), password })

      if (result.ok) {
        auth.signIn(result.data.accessToken, {
          userId: result.data.userId,
          roles: result.data.roles,
        })
        navigate('/', { replace: true })
      } else {
        setErrors({ general: result.message })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleForgotPassword() {
    navigate('/reset-password')
  }

  return (
    <AuthCard title={'Prefeitura de\nJacareí'} subtitle="Painel Moto.">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fields}>
          <FormField
            id="email"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            error={errors.email}
            disabled={loading}
          />
          <FormField
            id="password"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={setPassword}
            error={errors.password}
            disabled={loading}
          />
          {errors.general && (
            <p className={styles.generalError} role="alert">
              {errors.general}
            </p>
          )}
          <button
            type="button"
            className={styles.forgotLink}
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Esqueci minha senha
          </button>
        </div>
        <AppButton type="submit" loading={loading} disabled={loading || !email.trim() || !password}>
          Entrar
        </AppButton>
      </form>
    </AuthCard>
  )
}
