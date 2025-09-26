import categoryMap from '../data/category_map.ko.json'

export type CategoryStrength = 'leaf' | 'mid' | 'none'

export interface CategoryTagMap {
  leaf?: Record<string, string[]>
  mid?: Record<string, string[]>
  allergenHints?: Record<string, string[]>
}

export interface CategoryLevels {
  levels: string[]
}

export interface CategoryTagResult {
  tags: string[]
  strength: CategoryStrength
}

type WeatherFlags = Partial<{
  wet: boolean
  feels_cold: boolean
  muggy: boolean
  windy: boolean
  clear: boolean
  hot_peak: boolean
  cold_min: boolean
}>

interface CategoryAwarePlace {
  menuTags?: string[]
  categoryStrength?: CategoryStrength
}

interface PreferenceShape {
  allergies?: string[]
  dislikes?: string[]
}

const defaultMap = categoryMap as CategoryTagMap

const defaultNormalized = {
  leaf: buildNormalizedMap(defaultMap.leaf),
  mid: buildNormalizedMap(defaultMap.mid),
  allergen: buildNormalizedMap(defaultMap.allergenHints),
}

export function parseCategoryPath(path: string | null | undefined): CategoryLevels {
  if (!path || typeof path !== 'string') {
    return { levels: [] }
  }

  const cleaned = path
    .replace(/\s*>[\s>]+/g, '>')
    .replace(/[|/]/g, '>')
    .split('>')
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  return { levels: cleaned }
}

export function tagsFromCategory(levels: string[], map: CategoryTagMap = defaultMap): CategoryTagResult {
  if (!levels.length) {
    return { tags: [], strength: 'none' }
  }

  const normalizedLeaf = getNormalizedBucket(map.leaf, defaultMap.leaf, defaultNormalized.leaf)
  const normalizedMid = getNormalizedBucket(map.mid, defaultMap.mid, defaultNormalized.mid)

  // First try leaf for the last level
  const leafLevel = levels[levels.length - 1]
  const leafResult = resolveTags(leafLevel, map.leaf ?? {}, normalizedLeaf, 'leaf')
  if (leafResult) {
    return leafResult
  }

  // Then try mid for all levels, starting from the end
  for (let i = levels.length - 1; i >= 0; i -= 1) {
    const level = levels[i]
    const midResult = resolveTags(level, map.mid ?? {}, normalizedMid, 'mid')
    if (midResult) {
      return midResult
    }
  }

  return { tags: [], strength: 'none' }
}

export function categoryFit(
  place: CategoryAwarePlace,
  userPref: PreferenceShape,
  weatherFlags?: WeatherFlags
): number {
  const menuTags = (place.menuTags ?? []).map(normalizeTag)
  if (!menuTags.length) {
    return 0.45
  }

  const strength = place.categoryStrength ?? 'none'
  const strengthWeight = strength === 'leaf' ? 0.65 : strength === 'mid' ? 0.55 : 0.5

  const dislikeSet = new Set((userPref.dislikes ?? []).map(normalizeTag).map(stripWeight))
  if (menuTags.some((tag) => dislikeSet.has(stripWeight(tag)))) {
    return 0.05
  }

  let score = strengthWeight

  const totalWeight = menuTags.reduce((acc, tag) => acc + tagWeight(tag), 0)
  const distinctCount = new Set(menuTags.map(stripWeight)).size

  if (totalWeight > 0) {
    score += Math.min(totalWeight * 0.05, 0.2)
  }

  if (distinctCount >= 3) {
    score += 0.05
  } else if (distinctCount <= 1) {
    score -= 0.05
  }

  const weatherBonus = computeWeatherBonus(menuTags, weatherFlags)
  score += weatherBonus

  return clamp(score, 0, 1)
}

export function forbidFromAllergy(
  profile: PreferenceShape,
  tags: string[],
  map: CategoryTagMap = defaultMap
): boolean {
  if (!tags.length) return false

  const normalizedTags = tags.map(normalizeTag).map(stripWeight)
  const allergenSet = new Set<string>()

  const normalizedAllergen = getNormalizedBucket(map.allergenHints, defaultMap.allergenHints, defaultNormalized.allergen)

  for (const allergy of profile.allergies ?? []) {
    const normalized = normalizeTag(allergy)
    allergenSet.add(stripWeight(normalized))

    const hinted = resolveAllergenHints(normalized, normalizedAllergen)
    hinted.forEach((tag) => allergenSet.add(tag))
  }

  const dislikeSet = new Set((profile.dislikes ?? []).map(normalizeTag).map(stripWeight))

  if (normalizedTags.some((tag) => allergenSet.has(tag))) {
    return true
  }

  if (normalizedTags.some((tag) => dislikeSet.has(tag))) {
    return true
  }

  return false
}

function resolveTags(
  level: string,
  bucket: Record<string, string[]>,
  normalizedBucket: Record<string, string[]>,
  strength: CategoryStrength
): CategoryTagResult | null {
  if (!level) return null
  const normalizedLevel = normalizeCategory(level)

  const direct = normalizedBucket[normalizedLevel]
  if (direct) {
    return { tags: dedupeTags(direct), strength }
  }

  const partial = Object.entries(bucket).find(([key]) => normalizedLevel.includes(normalizeCategory(key)))
  if (partial) {
    const tags = partial[1]
    return { tags: dedupeTags(tags), strength }
  }

  return null
}

function resolveAllergenHints(allergy: string, normalizedBucket: Record<string, string[]>): string[] {
  const direct = normalizedBucket[normalizeCategory(allergy)]
  if (direct) {
    return direct.map(normalizeTag).map(stripWeight)
  }

  const partialKey = Object.keys(normalizedBucket).find((key) => key.includes(normalizeCategory(allergy)))
  if (partialKey) {
    return (normalizedBucket[partialKey] ?? []).map(normalizeTag).map(stripWeight)
  }

  return []
}

function buildNormalizedMap(source: Record<string, string[]> | undefined): Record<string, string[]> {
  if (!source) return {}

  return Object.entries(source).reduce<Record<string, string[]>>((acc, [key, value]) => {
    acc[normalizeCategory(key)] = value
    return acc
  }, {})
}

function getNormalizedBucket(
  current: Record<string, string[]> | undefined,
  expected: Record<string, string[]> | undefined,
  fallback: Record<string, string[]>
): Record<string, string[]> {
  if (current && expected && current === expected) {
    return fallback
  }
  if (!current) {
    return {}
  }
  return buildNormalizedMap(current)
}

function normalizeCategory(value: string): string {
  return value.replace(/\s+/g, '').replace(/,/g, '').toLowerCase()
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function stripWeight(tag: string): string {
  return tag.replace(/\?$/, '')
}

function tagWeight(tag: string): number {
  return tag.endsWith('?') ? 0.5 : 1
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

function computeWeatherBonus(tags: string[], weatherFlags?: WeatherFlags): number {
  if (!weatherFlags) return 0
  let bonus = 0

  const tagSet = new Set(tags.map(stripWeight))

  if (weatherFlags.wet || weatherFlags.windy || weatherFlags.feels_cold || weatherFlags.cold_min) {
    if (hasAny(tagSet, ['warm', 'soup', 'hotpot', 'broth'])) {
      bonus += 0.08
    }
  }

  if (weatherFlags.hot_peak || weatherFlags.muggy) {
    if (hasAny(tagSet, ['cold', 'salad', 'refresh', 'ice', 'dessert'])) {
      bonus += 0.08
    }
  }

  if (weatherFlags.clear) {
    if (hasAny(tagSet, ['picnic', 'outdoor', 'share'])) {
      bonus += 0.03
    }
  }

  return bonus
}

function hasAny(target: Set<string>, candidates: string[]): boolean {
  return candidates.some((candidate) => target.has(candidate))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
