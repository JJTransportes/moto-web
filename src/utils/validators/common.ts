export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value.trim()) return `${fieldName} é obrigatório.`
  return undefined
}

export function validateMaxLength(value: string, max: number, fieldName: string): string | undefined {
  if (value.length > max) return `${fieldName} deve ter no máximo ${max} caracteres.`
  return undefined
}

// Defense-in-depth for free-text inputs: blocks characters/patterns with no legitimate use
// in names, addresses, etc. (HTML/script tags, SQL meta-characters, event handler injection).
// This is NOT the primary defense — the backend must always use parameterized queries, and
// React already escapes rendered output — but it stops obviously malicious input at the door.
const UNSAFE_TEXT_PATTERN =
  /<|>|javascript:|on\w+\s*=|--|\/\*|\*\/|;\s*(drop|delete|insert|update|select|exec)\b|\bunion\s+select\b|\bdrop\s+table\b|\bxp_\w+/i

export function validateSafeText(value: string, fieldName: string): string | undefined {
  if (UNSAFE_TEXT_PATTERN.test(value)) {
    return `${fieldName} contém caracteres ou padrões não permitidos.`
  }
  return undefined
}
