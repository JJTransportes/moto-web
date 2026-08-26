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
