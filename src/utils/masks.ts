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
