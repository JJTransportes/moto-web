// Position rules: LLL D X DD (old plates have a digit at X, Mercosul plates have a letter)
const PLATE_POSITION_PATTERNS = [/[A-Z]/, /[A-Z]/, /[A-Z]/, /\d/, /[A-Z0-9]/, /\d/, /\d/]

export function maskPlate(value: string): string {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  let result = ''
  for (const ch of raw) {
    if (result.length >= 7) break
    if (PLATE_POSITION_PATTERNS[result.length].test(ch)) {
      result += ch
    }
  }
  return result
}

const PLATE_REGEX = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/

export function validatePlate(plate: string): string | undefined {
  const value = plate.trim().toUpperCase()
  if (!value) return 'Placa é obrigatório.'
  if (!PLATE_REGEX.test(value)) {
    return 'Placa inválida. Use o formato ABC1234 ou ABC1D23.'
  }
  return undefined
}

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * RG formats vary by state (SP: 9 chars digits+X; other states: up to 12
 * alphanumeric chars, some with letters beyond X). Just upper-cases and caps
 * length — no fixed punctuation pattern, since one doesn't fit every state.
 * Matches the backend's accepted range (7-12 chars after stripping punctuation).
 */
export function maskRg(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12)
}

/** Strips punctuation for API submission — backend expects raw digits (CPF) / raw alphanumeric (RG), no dots/dashes. */
export function unmaskCpf(value: string): string {
  return value.replace(/\D/g, '')
}

export function unmaskRg(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '')
}

export function maskCnh(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function maskUf(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
}

const VALID_UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

export function validateUf(uf: string): string | undefined {
  const value = uf.trim().toUpperCase()
  if (!value) return 'Estado é obrigatório.'
  if (!VALID_UFS.has(value)) {
    return 'Estado inválido. Use a sigla de uma UF válida (ex: SP, RJ, MG).'
  }
  return undefined
}

export function maskCountryCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
}
