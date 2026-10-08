export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'E-mail é obrigatório.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.'
  return undefined
}

export function validatePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 'Telefone é obrigatório.'
  if (digits.length < 10 || digits.length > 11) {
    return 'Telefone inválido. Informe DDD e número.'
  }
  const validAreaCodes = new Set([
    '11','12','13','14','15','16','17','18','19','21','22','24','27','28',
    '31','32','33','34','35','37','38','41','42','43','44','45','46','47','48','49',
    '51','53','54','55','61','62','63','64','65','66','67','68','69','71','73','74',
    '75','77','79','81','82','83','84','85','86','87','88','89','91','92','93','94',
    '95','96','97','98','99',
  ])
  if (!validAreaCodes.has(digits.slice(0, 2))) return 'DDD inválido.'
  const subscriber = digits.slice(2)
  if (new Set(subscriber).size === 1) return 'Telefone inválido.'
  if (digits.length === 11 && (!subscriber.startsWith('9') || Number(subscriber[1]) < 2)) {
    return 'Celular inválido.'
  }
  if (digits.length === 10 && (Number(subscriber[0]) < 2 || Number(subscriber[0]) > 5)) {
    return 'Telefone fixo inválido.'
  }
  return undefined
}

export interface PasswordRequirement {
  key: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { key: 'length', label: 'Entre 8 e 72 caracteres', test: p => p.length >= 8 && p.length <= 72 },
  { key: 'uppercase', label: 'Pelo menos 1 letra maiúscula', test: p => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Pelo menos 1 letra minúscula', test: p => /[a-z]/.test(p) },
  { key: 'digit', label: 'Pelo menos 1 número', test: p => /\d/.test(p) },
  { key: 'special', label: 'Pelo menos 1 caractere especial (ex: ! @ # $ % &)', test: p => /[^A-Za-z0-9\s]/.test(p) },
]

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every(r => r.test(password))
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Senha é obrigatória.'
  const failed = PASSWORD_REQUIREMENTS.filter(r => !r.test(password))
  if (failed.length > 0) {
    return failed.map(r => `A senha deve conter: ${r.label.toLowerCase()}.`).join(' ')
  }
  return undefined
}

export function validateConfirmEmail(email: string, confirmEmail: string): string | undefined {
  if (!confirmEmail.trim()) return 'Confirme o e-mail.'
  if (email.trim() !== confirmEmail.trim()) return 'Os e-mails não coincidem.'
  return undefined
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return 'Confirme a senha.'
  if (password !== confirmPassword) return 'Senhas não coincidem.'
  return undefined
}
