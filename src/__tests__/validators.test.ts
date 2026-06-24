import { describe, it, expect } from 'vitest'
import {
  validateCpf,
  validateCnh,
  validateBirthdate,
  validateFullName,
} from '../utils/validators'

describe('validateCpf', () => {
  it('returns undefined for a valid CPF', () => {
    // 529.982.247-25 is a known-valid CPF
    expect(validateCpf('529.982.247-25')).toBeUndefined()
    expect(validateCpf('52998224725')).toBeUndefined()
  })

  it('returns error for invalid check digits', () => {
    // Flip last digit of a valid CPF
    expect(validateCpf('52998224724')).toBe('CPF inválido.')
    expect(validateCpf('52998224726')).toBe('CPF inválido.')
  })

  it('returns error for all-same-digit sequences', () => {
    expect(validateCpf('00000000000')).toBe('CPF inválido.')
    expect(validateCpf('11111111111')).toBe('CPF inválido.')
    expect(validateCpf('99999999999')).toBe('CPF inválido.')
  })

  it('returns error for wrong length', () => {
    expect(validateCpf('1234567890')).toBe('CPF inválido.')   // 10 digits
    expect(validateCpf('123456789012')).toBe('CPF inválido.') // 12 digits
  })

  it('strips non-digit characters before validation', () => {
    expect(validateCpf('529.982.247-25')).toBeUndefined()
    expect(validateCpf('529 982 247 25')).toBeUndefined()
  })
})

describe('validateCnh', () => {
  it('returns error for invalid digit sequence', () => {
    // All-zero CNH
    expect(validateCnh('00000000000')).toBe('CNH inválida.')
  })

  it('returns error for wrong length', () => {
    expect(validateCnh('1234567890')).toBe('CNH inválida.')   // 10 digits
    expect(validateCnh('123456789012')).toBe('CNH inválida.') // 12 digits
  })

  it('returns error for all-same-digit sequences', () => {
    expect(validateCnh('11111111111')).toBe('CNH inválida.')
    expect(validateCnh('99999999999')).toBe('CNH inválida.')
  })
})

describe('validateBirthdate', () => {
  it('returns error for a future date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const iso = tomorrow.toISOString().split('T')[0]
    expect(validateBirthdate(iso)).toBeTruthy()
  })

  it('returns error for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(validateBirthdate(today)).toBeTruthy()
  })

  it('returns undefined for a past date', () => {
    expect(validateBirthdate('1990-06-15')).toBeUndefined()
    expect(validateBirthdate('2000-01-01')).toBeUndefined()
  })

  it('returns error for an empty string', () => {
    expect(validateBirthdate('')).toBeTruthy()
  })

  it('returns error for an invalid date string', () => {
    expect(validateBirthdate('not-a-date')).toBeTruthy()
  })
})

describe('validateFullName', () => {
  it('returns error for an empty string', () => {
    expect(validateFullName('')).toBeTruthy()
    expect(validateFullName('   ')).toBeTruthy()
  })

  it('returns error for a name over 255 characters', () => {
    expect(validateFullName('A'.repeat(256))).toBeTruthy()
  })

  it('returns undefined for a valid name', () => {
    expect(validateFullName('Maria Aparecida da Silva')).toBeUndefined()
  })

  it('returns undefined for exactly 255 characters', () => {
    expect(validateFullName('A'.repeat(255))).toBeUndefined()
  })
})
