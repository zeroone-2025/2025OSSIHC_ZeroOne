import { describe, it, expect } from 'vitest'
import { forbidFromAllergy, hasAllergenConflict } from '../lib/allergy'

describe('allergy utilities', () => {
  it('forbids shellfish when user has shellfish allergy', () => {
    const result = forbidFromAllergy(['갑각류'], ['shellfish', 'warm'])
    expect(result).toBe(true)
  })

  it('forbids shellfish when user has shellfish allergy (English)', () => {
    const result = forbidFromAllergy(['shellfish'], ['shellfish', 'warm'])
    expect(result).toBe(true)
  })

  it('does not forbid safe foods', () => {
    const result = forbidFromAllergy(['갑각류'], ['salad', 'vegetarian'])
    expect(result).toBe(false)
  })

  it('handles empty allergen list', () => {
    const result = forbidFromAllergy([], ['shellfish', 'nuts'])
    expect(result).toBe(false)
  })

  it('handles empty tag list', () => {
    const result = forbidFromAllergy(['갑각류'], [])
    expect(result).toBe(false)
  })

  describe('hasAllergenConflict', () => {
    it('detects shellfish conflicts with Korean terms', () => {
      const result = hasAllergenConflict(['갑각류'], ['새우', '볶음'])
      expect(result).toBe(true)
    })

    it('detects shellfish conflicts with English terms', () => {
      const result = hasAllergenConflict(['shellfish'], ['shrimp', 'fried'])
      expect(result).toBe(true)
    })

    it('detects cross-language conflicts', () => {
      const result = hasAllergenConflict(['갑각류'], ['crab', 'soup'])
      expect(result).toBe(true)
    })

    it('detects conflicts in ingredients list', () => {
      const result = hasAllergenConflict(
        ['shellfish'],
        ['korean'],
        ['새우', '야채', '밥']
      )
      expect(result).toBe(true)
    })

    it('returns false for safe combinations', () => {
      const result = hasAllergenConflict(
        ['갑각류'],
        ['vegetarian', 'soup'],
        ['야채', '두부', '국물']
      )
      expect(result).toBe(false)
    })

    it('handles nuts allergy', () => {
      const result = hasAllergenConflict(['견과류'], ['peanut', 'sauce'])
      expect(result).toBe(true)
    })

    it('handles dairy allergy', () => {
      const result = hasAllergenConflict(['유제품'], ['cheese', 'pizza'])
      expect(result).toBe(true)
    })

    it('handles gluten allergy', () => {
      const result = hasAllergenConflict(['글루텐'], ['wheat', 'bread'])
      expect(result).toBe(true)
    })
  })
})