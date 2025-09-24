import { getPreferences, getRecentRestaurantIds, setPendingReview as storeSetPendingReview } from './store'
import { loadMergedWeather } from './weather'
import { getRecommendations } from './recommend'
import { getNextQuestion, MissingOperatorKeyError, NextQuestion } from './llm'
import type { Event, SessionState } from './state'
import type { Restaurant, WeatherSnapshot, RecommendationResult } from './types'
import { forbidFromAllergy, parseCategoryPath, tagsFromCategory } from '../src/lib/category'

const CATEGORY_FALLBACKS: Record<Restaurant['category'], string> = {
  korean: '음식점 > 한식',
  japanese: '음식점 > 일식',
  chinese: '음식점 > 중식',
  vietnamese: '음식점 > 아시아음식 > 베트남음식',
  indian: '음식점 > 아시아음식 > 인도음식',
}

export async function boot(
  dispatch: (event: Event) => void
): Promise<{ weather?: WeatherSnapshot; places: Restaurant[]; user?: { lat: number; lng: number } }> {
  dispatch({ type: 'BOOT_INIT' })

  try {
    const user = await resolveUserLocation()
    const [weather, places] = await Promise.all([
      loadMergedWeather(user?.lat, user?.lng),
      fetchRestaurantPool(),
    ])

    const filtered = applyHardFilters(places, user)

    dispatch({ type: 'POOL_SEEDED', places: filtered, weather, user })
    dispatch({ type: 'ASK_NEXT' })

    return { weather, places: filtered, user }
  } catch (error) {
    const message = error instanceof Error ? error.message : '초기화에 실패했습니다.'
    dispatch({ type: 'ERROR', message })
    throw error
  }
}

export async function askNext(state: SessionState): Promise<NextQuestion> {
  try {
    return await getNextQuestion(state)
  } catch (error) {
    if (error instanceof MissingOperatorKeyError) {
      throw error
    }
    throw new Error(error instanceof Error ? error.message : '질문 생성을 실패했습니다.')
  }
}

export function applyAnswer(state: SessionState): RecommendationResult[] {
  const source = state.pool.length ? state.pool : state.places
  return getRecommendations(source, state.weather, undefined, state)
}

export function finalize(state: SessionState): RecommendationResult[] {
  const source = state.pool.length ? state.pool : state.places
  return getRecommendations(source, state.weather, undefined, state).slice(0, 5)
}

export function scheduleReview(placeId: string): void {
  storeSetPendingReview({ placeId, decidedAt: Date.now() })

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          setTimeout(() => {
            new Notification('점심 평가 부탁드려요', {
              body: '방문하신 식당은 어떠셨나요? 프로필에서 취향을 업데이트할 수도 있어요.',
            })
          }, 90 * 60 * 1000)
        }
      })
    } catch {
      /* noop */
    }
  }
}

async function resolveUserLocation(): Promise<{ lat: number; lng: number } | undefined> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { lat: 37.5665, lng: 126.978 }
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
    )
    return { lat: position.coords.latitude, lng: position.coords.longitude }
  } catch {
    return { lat: 37.5665, lng: 126.978 }
  }
}

async function fetchRestaurantPool(): Promise<Restaurant[]> {
  const response = await fetch('/data/restaurants.json')
  if (!response.ok) {
    throw new Error('식당 데이터를 불러오지 못했습니다.')
  }
  return response.json()
}

function applyHardFilters(
  places: Restaurant[],
  user?: { lat: number; lng: number }
): Restaurant[] {
  const prefs = getPreferences()
  const recent = new Set(getRecentRestaurantIds(7))
  const radiusMeters = 1500

  return places.filter((restaurant) => {
    if (recent.has(restaurant.id)) return false
    if (restaurant.allergens.some((allergen) => prefs.allergies.includes(allergen))) return false

    const menuTags = deriveMenuTags(restaurant)
    if (forbidFromAllergy(prefs, menuTags)) return false

    if (user) {
      const distance = haversine(user.lat, user.lng, restaurant.lat, restaurant.lng)
      if (distance > radiusMeters) return false
    }

    return true
  })
}

function deriveMenuTags(restaurant: Restaurant): string[] {
  const declared = typeof restaurant.category_name === 'string' ? restaurant.category_name : ''
  const explicitLevels = parseCategoryPath(declared).levels
  const fallbackLevels = explicitLevels.length
    ? explicitLevels
    : parseCategoryPath(CATEGORY_FALLBACKS[restaurant.category] ?? '').levels

  const mapping = tagsFromCategory(fallbackLevels)
  if (mapping.tags.length) {
    return mapping.tags
  }

  if (Array.isArray(restaurant.tags) && restaurant.tags.length) {
    return Array.from(new Set(restaurant.tags.map((tag) => tag.toLowerCase())))
  }

  return []
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
