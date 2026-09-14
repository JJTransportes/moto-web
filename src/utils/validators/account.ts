export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'E-mail é obrigatório.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.'
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
