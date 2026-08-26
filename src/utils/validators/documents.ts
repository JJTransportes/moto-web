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

export function validateCnh(cnh: string): string | undefined {
  const digits = cnh.replace(/\D/g, '')
  if (digits.length !== 11) return 'CNH inválida.'
  if (/^(\d)\1{10}$/.test(digits)) return 'CNH inválida.'
  return undefined
}

/** Matches the backend's PersonValidator range (7-12 chars, after stripping punctuation). */
export function validateRg(rg: string): string | undefined {
  const cleaned = rg.replace(/[\s.\-/]/g, '')
  if (!cleaned) return 'RG é obrigatório.'
  if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
    return 'RG deve conter apenas caracteres alfanuméricos.'
  }
  if (cleaned.length < 7 || cleaned.length > 12) {
    return 'RG deve ter entre 7 e 12 caracteres.'
  }
  return undefined
}
