import { Restaurant, RecommendationResult, WeatherSnapshot, Pref } from './types'
import type { SessionState } from './state'
import { getPreferences, getRecentRestaurantIds } from './store'
import {
  categoryFit,
  forbidFromAllergy,
  parseCategoryPath,
  tagsFromCategory,
  type CategoryStrength,
} from '../src/lib/category'

interface CategoryEnrichedRestaurant extends Restaurant {
  menuTags: string[]
  categoryLevels: string[]
  categoryStrength: CategoryStrength
}

interface ScoredRestaurant {
  restaurant: CategoryEnrichedRestaurant
  score: number
  reasons: string[]
  eta: number
}

interface DerivedIntents {
  mealMode: 'light' | 'hearty' | null
  groupSize: number | null
  freeTimeMins: number | null
}

const DEFAULT_WEIGHTS = {
  distance: 0.2,
  novelty7d: 0.1,
  preference: 0.12,
  nutrition: 0.13,
  weather: 0.25,
  situation: 0.1,
  group: 0.05,
  category: 0.05,
}

const CATEGORY_FALLBACKS: Record<Restaurant['category'], string> = {
  korean: '음식점 > 한식',
  japanese: '음식점 > 일식',
  chinese: '음식점 > 중식',
  vietnamese: '음식점 > 아시아음식 > 베트남음식',
  indian: '음식점 > 아시아음식 > 인도음식',
}

function enrichRestaurant(restaurant: Restaurant): CategoryEnrichedRestaurant {
  const existingMenu = Array.isArray(restaurant.menuTags) ? restaurant.menuTags : undefined
  const existingLevels = Array.isArray(restaurant.categoryLevels) ? restaurant.categoryLevels : []
  const declaredCategory = typeof restaurant.category_name === 'string' ? restaurant.category_name : ''

  const explicitLevels = parseCategoryPath(declaredCategory).levels
  const fallbackLevels = explicitLevels.length
    ? explicitLevels
    : existingLevels.length
    ? existingLevels
    : parseCategoryPath(CATEGORY_FALLBACKS[restaurant.category] ?? '').levels

  const mapping = tagsFromCategory(fallbackLevels)

  let menuTags = existingMenu ?? mapping.tags
  let strength: CategoryStrength = restaurant.categoryStrength ?? mapping.strength

  if ((!menuTags || !menuTags.length) && Array.isArray(restaurant.tags)) {
    menuTags = restaurant.tags.map((tag) => tag.toLowerCase())
    if (strength === 'none') {
      strength = 'mid'
    }
  }

  const normalizedMenuTags = Array.from(new Set((menuTags ?? []).map((tag) => tag.toLowerCase())))
  const resolvedLevels = fallbackLevels
  const resolvedCategoryName = declaredCategory.trim()
    ? declaredCategory
    : resolvedLevels.length
    ? resolvedLevels.join(' > ')
    : declaredCategory

  return {
    ...restaurant,
    category_name: resolvedCategoryName,
    categoryLevels: resolvedLevels,
    categoryStrength: strength,
    menuTags: normalizedMenuTags,
  }
}

export function getRecommendations(
  restaurants: Restaurant[],
  weather?: WeatherSnapshot,
  config?: { weights?: Partial<typeof DEFAULT_WEIGHTS> },
  session?: SessionState
): RecommendationResult[] {
  const prefs = getPreferences()
  const derived = deriveIntents(session)
  const recentIds = new Set(getRecentRestaurantIds(7))

  const enriched = restaurants.map(enrichRestaurant)

  const available = enriched.filter((restaurant) => {
    if (recentIds.has(restaurant.id)) return false
    if (restaurant.allergens.some((allergen) => prefs.allergies.includes(allergen))) return false
    if (forbidFromAllergy(prefs, restaurant.menuTags)) return false
    return true
  })

  const weights = { ...DEFAULT_WEIGHTS, ...(config?.weights ?? {}) }

  const scored = available.map((restaurant) =>
    scoreRestaurant(restaurant, prefs, weather, weights, session, derived)
  )

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, Math.min(5, scored.length)).map((entry) => ({
    restaurant: { ...entry.restaurant, etaMins: entry.eta },
    reason: entry.reasons.join(' · '),
    etaMins: entry.eta,
  }))
}

function scoreRestaurant(
  restaurant: CategoryEnrichedRestaurant,
  prefs: Pref,
  weather: WeatherSnapshot | undefined,
  weights: typeof DEFAULT_WEIGHTS,
  session: SessionState | undefined,
  derived: DerivedIntents
): ScoredRestaurant {
  const reasons: string[] = []

  const weatherEffect = prefs.weather && weather
    ? calculateWeatherScore(restaurant, weather)
    : { score: 0.5, reasons: [] as string[], distanceModifier: 1 }
  if (prefs.weather && weatherEffect.reasons.length) {
    reasons.push(...weatherEffect.reasons)
  }

  const distanceInfo = computeDistanceScore(
    restaurant,
    session?.user,
    derived.freeTimeMins,
    weather?.flags?.wet || weather?.flags?.windy ? 1.15 : 1,
    weatherEffect.distanceModifier
  )
  reasons.push(...distanceInfo.reasons)
  let totalScore = distanceInfo.score * weights.distance

  totalScore += weights.novelty7d
  reasons.push('[프로필] 7일 내 미방문')

  const preferenceInfo = calculatePreferenceScore(restaurant, prefs, derived)
  totalScore += preferenceInfo.score * weights.preference
  reasons.push(...preferenceInfo.reasons)

  const nutritionInfo = calculateNutritionScore(restaurant, derived)
  totalScore += nutritionInfo.score * weights.nutrition
  reasons.push(...nutritionInfo.reasons)

  const situationInfo = calculateSituationScore(derived)
  totalScore += situationInfo.score * weights.situation
  reasons.push(...situationInfo.reasons)

  const groupInfo = calculateGroupScore(restaurant, derived)
  totalScore += groupInfo.score * weights.group
  reasons.push(...groupInfo.reasons)

  totalScore += weatherEffect.score * weights.weather

  const categoryInfo = calculateCategoryScore(restaurant, prefs, weather)
  totalScore += categoryInfo.score * weights.category
  reasons.push(...categoryInfo.reasons)
  if (categoryInfo.showLeafBadge) {
    reasons.push('업종 기반')
  }

  const uniqueReasons = Array.from(new Set(reasons.filter(Boolean))).slice(0, 6)

  return {
    restaurant,
    score: totalScore,
    reasons: uniqueReasons,
    eta: distanceInfo.eta,
  }
}

function computeDistanceScore(
  restaurant: Restaurant,
  user: { lat: number; lng: number } | undefined,
  freeTimeMins: number | null,
  weatherEtaMultiplier: number,
  weatherModifier: number
): { score: number; reasons: string[]; eta: number } {
  let eta = typeof restaurant.etaMins === 'number' ? restaurant.etaMins : 8
  if (user) {
    const distanceMeters = haversine(user.lat, user.lng, restaurant.lat, restaurant.lng)
    eta = distanceMeters / 80
  }

  eta = Math.max(1, Math.round(eta * weatherEtaMultiplier))

  let score = 0.6
  const reasons: string[] = []

  if (freeTimeMins) {
    score = Math.max(0, 1 - eta / freeTimeMins)
    if (eta <= freeTimeMins) {
      reasons.push(`[답변] ${freeTimeMins}분 내 도착`)
    }
  } else {
    if (eta <= 5) score = 0.85
    else if (eta <= 10) score = 0.65
    else score = 0.45
  }

  score *= weatherModifier
  reasons.push(`[ETA] ${eta}분 예상`)

  return { score, reasons, eta }
}

function calculatePreferenceScore(
  restaurant: CategoryEnrichedRestaurant,
  prefs: Pref,
  derived: DerivedIntents
): { score: number; reasons: string[] } {
  let score = 0.5
  const reasons: string[] = []

  const dislikeSet = new Set((prefs.dislikes ?? []).map((tag) => tag.toLowerCase()))
  const hasDisliked = restaurant.tags.some((tag) => dislikeSet.has(tag.toLowerCase())) ||
    restaurant.menuTags.some((tag) => dislikeSet.has(tag))

  if (hasDisliked) {
    score -= 0.3
    reasons.push('[프로필] 비선호 주의')
  } else if (prefs.dislikes.length) {
    reasons.push('[프로필] 비선호 회피')
  }

  if (prefs.allergies.length) {
    reasons.push('[프로필] 알레르기 제거')
  }

  if (derived.mealMode === 'light') {
    if (restaurant.macros.kcal < 450) score += 0.25
    if (hasAnyTag(restaurant, ['light', 'salad', 'cold'])) score += 0.15
    reasons.push('[답변] 가벼운 식사')
  } else if (derived.mealMode === 'hearty') {
    if (restaurant.macros.protein > 25) score += 0.25
    if (hasAnyTag(restaurant, ['hearty', 'meat', 'bbq'])) score += 0.15
    reasons.push('[답변] 든든한 식사')
  }

  return { score: clamp01(score), reasons }
}

function calculateNutritionScore(
  restaurant: CategoryEnrichedRestaurant,
  derived: DerivedIntents
): { score: number; reasons: string[] } {
  let score = 0.5
  const reasons: string[] = []

  if (derived.mealMode === 'light') {
    if (restaurant.macros.kcal <= 400) {
      score += 0.2
      reasons.push('[답변] 400kcal 이하')
    }
  }

  if (derived.mealMode === 'hearty') {
    if (restaurant.macros.protein >= 30) {
      score += 0.2
      reasons.push('[답변] 단백질 강화')
    }
  }

  return { score: clamp01(score), reasons }
}

function calculateSituationScore(derived: DerivedIntents): { score: number; reasons: string[] } {
  if (!derived.freeTimeMins) {
    return { score: 0.5, reasons: [] }
  }

  if (derived.freeTimeMins <= 10) {
    return { score: 0.7, reasons: ['[답변] 빠른 식사 선호'] }
  }

  return { score: 0.55, reasons: [] }
}

function calculateGroupScore(
  restaurant: CategoryEnrichedRestaurant,
  derived: DerivedIntents
): { score: number; reasons: string[] } {
  if (!derived.groupSize) {
    return { score: 0.5, reasons: [] }
  }

  if (derived.groupSize <= 1) {
    if (hasTag(restaurant, 'solo')) {
      return { score: 0.7, reasons: ['[답변] 혼밥 적합'] }
    }
    return { score: 0.55, reasons: [] }
  }

  if (derived.groupSize >= 3) {
    if (hasAnyTag(restaurant, ['group', 'spacious', 'share'])) {
      return { score: 0.75, reasons: ['[답변] 단체 여유 공간'] }
    }
    return { score: 0.45, reasons: ['[답변] 단체 좌석 확인 필요'] }
  }

  return { score: 0.6, reasons: [] }
}

function calculateCategoryScore(
  restaurant: CategoryEnrichedRestaurant,
  prefs: Pref,
  weather: WeatherSnapshot | undefined
): { score: number; reasons: string[]; showLeafBadge: boolean } {
  if (!restaurant.menuTags.length) {
    return { score: 0.45, reasons: [], showLeafBadge: false }
  }

  const fit = categoryFit(restaurant, prefs, weather?.flags)
  const reasons: string[] = []
  const label = restaurant.categoryLevels[restaurant.categoryLevels.length - 1] ??
    restaurant.categoryLevels[0] ??
    (restaurant.category_name ?? '').split('>').pop()?.trim()

  if (fit >= 0.6 && label) {
    reasons.push(`[업종] ${label} 매칭`)
  }

  const flags = weather?.flags
  if (flags?.wet || flags?.feels_cold || flags?.cold_min) {
    if (hasAnyTag(restaurant, ['warm', 'soup', 'hotpot', 'broth'])) {
      reasons.push('[업종] 꿀꿀한 날 따뜻한 선택')
    }
  } else if (flags?.hot_peak || flags?.muggy) {
    if (hasAnyTag(restaurant, ['cold', 'salad', 'refresh', 'ice'])) {
      reasons.push('[업종] 더위엔 시원한 메뉴')
    }
  }

  return {
    score: fit,
    reasons,
    showLeafBadge: restaurant.categoryStrength === 'leaf' && fit >= 0.55,
  }
}

function calculateWeatherScore(
  restaurant: CategoryEnrichedRestaurant,
  weather: WeatherSnapshot
): { score: number; reasons: string[]; distanceModifier: number } {
  let score = 0.5
  const reasons: string[] = []
  let distanceModifier = 1

  const { flags } = weather

  if (flags.wet || flags.feels_cold) {
    if (hasAnyTag(restaurant, ['warm', 'soup', 'hotpot', 'broth'])) {
      score += 0.3
      reasons.push('[날씨] 비/체감 추움')
    }
    distanceModifier = 0.9
  }

  if (flags.muggy) {
    if (hasAnyTag(restaurant, ['cold', 'salad', 'refresh'])) {
      score += 0.25
      reasons.push('[날씨] 후덥지근')
    }
  }

  if (flags.hot_peak) {
    if (hasAnyTag(restaurant, ['cold', 'salad', 'refresh'])) {
      score += 0.2
      reasons.push('[날씨] 폭염 주의')
    }
  }

  if (flags.cold_min) {
    if (hasTag(restaurant, 'warm')) {
      score += 0.2
      reasons.push('[날씨] 한파 대비')
    }
  }

  if (flags.windy) {
    distanceModifier *= 0.9
    reasons.push('[날씨] 강풍')
  }

  return { score: clamp01(score), reasons, distanceModifier }
}

function hasTag(restaurant: CategoryEnrichedRestaurant, tag: string): boolean {
  const normalized = tag.toLowerCase()
  if (restaurant.menuTags.includes(normalized)) return true
  return restaurant.tags.some((candidate) => candidate.toLowerCase() === normalized)
}

function hasAnyTag(restaurant: CategoryEnrichedRestaurant, candidates: string[]): boolean {
  return candidates.some((tag) => hasTag(restaurant, tag))
}

function deriveIntents(session: SessionState | undefined): DerivedIntents {
  const derived: DerivedIntents = {
    mealMode: null,
    groupSize: null,
    freeTimeMins: session?.freeTimeMins ?? null,
  }

  if (!session) return derived

  for (const answer of session.answers) {
    if (answer.intent === 'meal_feel') {
      const lower = answer.option.toLowerCase()
      if (lower.includes('가볍') || lower.includes('light')) derived.mealMode = 'light'
      else if (lower.includes('든든') || lower.includes('hearty') || lower.includes('heavy')) derived.mealMode = 'hearty'
    }

    if (answer.intent === 'group_dyn') {
      derived.groupSize = parseGroupSize(answer.option)
    }

    if (answer.intent === 'time_pressure' && !derived.freeTimeMins) {
      derived.freeTimeMins = parseTimePressure(answer.option)
    }
  }

  return derived
}

function parseGroupSize(option: string): number | null {
  const lower = option.toLowerCase()
  if (lower.includes('혼자') || lower.includes('1')) return 1
  if (lower.includes('둘') || lower.includes('2')) return 2
  if (lower.includes('셋') || lower.includes('3')) return 3
  if (lower.includes('넷') || lower.includes('4')) return 4
  if (lower.includes('단체') || lower.includes('여럿') || lower.includes('팀')) return 4
  const numeric = parseInt(option, 10)
  return Number.isFinite(numeric) ? numeric : null
}

function parseTimePressure(option: string): number | null {
  const lower = option.toLowerCase()
  if (lower.includes('5')) return 5
  if (lower.includes('10')) return 10
  if (lower.includes('15')) return 15
  if (lower.includes('20')) return 20
  if (lower.includes('여유') || lower.includes('상관없')) return 25
  const numeric = parseInt(option, 10)
  return Number.isFinite(numeric) ? numeric : null
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function adjustWeightsForDistanceTradeoff(baseWeights: any, option: string): any {
  const weights = { ...baseWeights }
  const opt = option.toLowerCase()

  if (opt.includes('가까운') || opt.includes('빠른') || opt.includes('가깝') || opt.includes('빠르')) {
    weights.distance = Math.min(0.3, (weights.distance ?? DEFAULT_WEIGHTS.distance) + 0.05)
  } else if (opt.includes('멀어도') || opt.includes('시간 상관없') || opt.includes('거리 상관없')) {
    weights.distance = Math.max(0.1, (weights.distance ?? DEFAULT_WEIGHTS.distance) - 0.05)
  }

  return weights
}
