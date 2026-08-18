export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value.trim()) return `${fieldName} é obrigatório.`
  return undefined
}

export function validateMaxLength(value: string, max: number, fieldName: string): string | undefined {
  if (value.length > max) return `${fieldName} deve ter no máximo ${max} caracteres.`
  return undefined
}
