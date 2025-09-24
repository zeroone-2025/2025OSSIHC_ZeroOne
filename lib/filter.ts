import type { Pref } from './types'
import type { KakaoPlace } from './kakao'

export function forbidByAllergy(prefs: Pref, tags: string[] = []): boolean {
  if (!prefs.allergies.length) return false
  const lowered = tags.map((tag) => tag.toLowerCase())
  return prefs.allergies.some((allergy) => lowered.includes(allergy.toLowerCase()))
}

interface RankOptions {
  maxDistanceM?: number
  maxResults?: number
}

export function rankPlaces(places: KakaoPlace[], options: RankOptions = {}): KakaoPlace[] {
  const maxDistance = options.maxDistanceM ?? 1800
  const maxResults = options.maxResults ?? 10

  const filtered = places.filter((place) => {
    if (typeof place.distanceM === 'number' && place.distanceM > maxDistance) return false
    return true
  })

  filtered.sort((a, b) => {
    const aEta = a.etaMins ?? 999
    const bEta = b.etaMins ?? 999
    if (aEta !== bEta) return aEta - bEta
    const aDist = a.distanceM ?? 999999
    const bDist = b.distanceM ?? 999999
    return aDist - bDist
  })

  return filtered.slice(0, maxResults)
}
