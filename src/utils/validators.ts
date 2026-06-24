export function validateCpf(cpf: string): string | undefined {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return 'CPF inválido.'
  if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido.'

  const calcDigit = (d: string, length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += parseInt(d[i]) * (length + 1 - i)
    const rem = (sum * 10) % 11
    return rem === 10 || rem === 11 ? 0 : rem
  }

  if (calcDigit(digits, 9) !== parseInt(digits[9])) return 'CPF inválido.'
  if (calcDigit(digits, 10) !== parseInt(digits[10])) return 'CPF inválido.'
  return undefined
}

export function validateRg(rg: string): string | undefined {
  if (!rg.trim()) return 'RG é obrigatório.'
  if (!/^[a-zA-Z0-9]+$/.test(rg.replace(/[\s.\-/]/g, ''))) {
    return 'RG deve conter apenas caracteres alfanuméricos.'
  }
  return undefined
}

export function validateBirthdate(date: string): string | undefined {
  if (!date) return 'Data de nascimento é obrigatória.'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Data de nascimento inválida.'
  const todayStr = new Date().toISOString().split('T')[0]
  if (date >= todayStr) return 'Data de nascimento deve ser no passado.'
  return undefined
}

export function validateFullName(name: string): string | undefined {
  if (!name.trim()) return 'Nome completo é obrigatório.'
  if (name.length > 255) return 'Nome completo deve ter no máximo 255 caracteres.'
  return undefined
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'E-mail é obrigatório.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.'
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Senha é obrigatória.'
  if (password.length < 8) return 'Senha deve ter no mínimo 8 caracteres.'
  return undefined
}

export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value.trim()) return `${fieldName} é obrigatório.`
  return undefined
}
