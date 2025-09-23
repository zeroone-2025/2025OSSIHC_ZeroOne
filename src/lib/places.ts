import { parseCategoryPath, tagsFromCategory, CategoryStrength, CategoryTagMap } from './category'

export interface KakaoPlace {
  id: string
  place_name: string
  category_name?: string
  category_group_code?: string
  distance?: string
  road_address_name?: string
  x?: string
  y?: string
}

export interface NormalizedPlace {
  id: string
  name: string
  category_name: string
  category_group_code?: string
  distanceM: number | null
  etaMins: number | null
  categoryLevels: string[]
  categoryStrength: CategoryStrength
  menuTags: string[]
}

interface NormalizeOptions {
  categoryMap?: CategoryTagMap
  defaultPaceMetersPerMinute?: number
}

const DEFAULT_PACE = 80

export function normalizePlace(raw: KakaoPlace, options: NormalizeOptions = {}): NormalizedPlace {
  const categoryName = typeof raw.category_name === 'string' ? raw.category_name : ''
  const { levels } = parseCategoryPath(categoryName)
  const mapping = tagsFromCategory(levels, options.categoryMap)
  const menuTags = mapping.tags
  const categoryStrength = mapping.strength

  const distanceM = parseDistance(raw.distance)
  const pace = options.defaultPaceMetersPerMinute ?? DEFAULT_PACE
  const eta = typeof distanceM === 'number' && distanceM >= 0 ? Math.max(1, Math.round(distanceM / pace)) : null

  return {
    id: raw.id,
    name: raw.place_name,
    category_name: categoryName,
    category_group_code: raw.category_group_code,
    distanceM,
    etaMins: eta,
    categoryLevels: levels,
    categoryStrength,
    menuTags,
  }
}

function parseDistance(distance?: string): number | null {
  if (typeof distance !== 'string' || !distance.trim()) {
    return null
  }

  const parsed = Number(distance)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  const cleaned = distance.replace(/[^0-9.]/g, '')
  const fallback = Number(cleaned)
  return Number.isFinite(fallback) ? fallback : null
}
