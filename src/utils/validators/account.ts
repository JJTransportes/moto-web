export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'E-mail é obrigatório.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.'
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Senha é obrigatória.'
  if (password.length < 8) return 'Senha deve ter no mínimo 8 caracteres.'
  if (password.length > 72) return 'Senha deve ter no máximo 72 caracteres.'
  return undefined
}
