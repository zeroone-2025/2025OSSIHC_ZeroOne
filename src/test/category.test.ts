import { describe, it, expect } from 'vitest'
import {
  parseCategoryPath,
  tagsFromCategory,
  categoryFit,
  forbidFromAllergy,
} from '../lib/category'
import { normalizePlace } from '../lib/places'

describe('category mapping utilities', () => {
  it('parses Kakao category path into levels', () => {
    const { levels } = parseCategoryPath('음식점 > 한식 > 국밥')
    expect(levels).toEqual(['음식점', '한식', '국밥'])
  })

  it('prioritises leaf tags over mid-level', () => {
    const { tags, strength } = tagsFromCategory(['음식점', '한식', '국밥'])
    expect(strength).toBe('leaf')
    expect(tags).toContain('soup')
    expect(tags).toContain('warm')
  })

  it('falls back to mid-level tags when leaf is missing', () => {
    const { tags, strength } = tagsFromCategory(['음식점', '분식'])
    expect(strength).toBe('mid')
    expect(tags).toContain('snack')
    expect(tags.find((tag) => tag.startsWith('noodle'))).toBeDefined()
  })

  it('returns none strength for unmapped categories', () => {
    const { tags, strength } = tagsFromCategory(['음식점', '알수없음', '기타'])
    expect(strength).toBe('none')
    expect(tags).toEqual([])
  })

  it('normalizes Kakao place payload with menu tags and eta', () => {
    const place = normalizePlace({
      id: 'p1',
      place_name: '테스트 국밥',
      category_name: '음식점 > 한식 > 국밥',
      category_group_code: 'FD6',
      distance: '320',
    })

    expect(place.menuTags).toContain('soup')
    expect(place.categoryStrength).toBe('leaf')
    expect(place.distanceM).toBe(320)
    expect(place.etaMins).toBe(4)
  })

  it('flags allergen conflicts via mapped tags', () => {
    const risky = forbidFromAllergy(
      { allergies: ['갑각류'], dislikes: [] },
      ['shellfish', 'warm']
    )
    expect(risky).toBe(true)

    const safe = forbidFromAllergy(
      { allergies: ['갑각류'], dislikes: [] },
      ['salad']
    )
    expect(safe).toBe(false)
  })

  it('scores category fit using menu tags and weather signals', () => {
    const score = categoryFit(
      { menuTags: ['soup', 'warm'], categoryStrength: 'leaf' },
      { dislikes: [], allergies: [] },
      { wet: true }
    )

    expect(score).toBeGreaterThan(0.6)
  })
})
