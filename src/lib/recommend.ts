import { parseCategoryPath, tagsFromCategory, categoryFit, CategoryStrength } from './category'
import { forbidFromAllergy } from './allergy'
import { matchByTags, getDishesbyCategory, Dish } from './dataset'

// Types
export interface PlaceCandidate {
  id: string
  place_name: string
  category_name: string
  lat: number
  lng: number
  distance: number
  categoryPath: string[]
}

export interface RecoResult {
  restaurant: {
    id: string
    name: string
    lat: number
    lng: number
    distanceM: number
    categoryStrength: CategoryStrength
    menuTags: string[]
  }
  reason: string
  score: number
  etaMins: number
  badges: string[]
}

interface PreferenceShape {
  allergies?: string[]
  dislikes?: string[]
}

interface WeatherFlags {
  wet?: boolean
  feels_cold?: boolean
  muggy?: boolean
  windy?: boolean
  clear?: boolean
  hot_peak?: boolean
  cold_min?: boolean
}

interface RecommendOptions {
  userPreferences?: PreferenceShape
  weather?: WeatherFlags
  maxResults?: number
  logger?: boolean
}

/**
 * Main recommendation pipeline
 */
export async function getRecommendations(
  places: PlaceCandidate[],
  options: RecommendOptions = {}
): Promise<RecoResult[]> {
  const {
    userPreferences = {},
    weather = {},
    maxResults = 5,
    logger = false
  } = options

  const results: RecoResult[] = []

  if (logger) {
    console.log(`[Recommend] Processing ${places.length} places with preferences:`, userPreferences)
  }

  for (const place of places) {
    try {
      // 1. Parse category and get tags with strength
      const { levels } = parseCategoryPath(place.category_name)
      const { tags, strength } = tagsFromCategory(levels)

      if (logger) {
        console.log(`[Recommend] ${place.place_name}: ${levels.join(' > ')} -> tags: ${tags.join(', ')}, strength: ${strength}`)
      }

      // 2. Check allergen conflicts
      const allergyForbidden = forbidFromAllergy(
        userPreferences.allergies || [],
        tags
      )

      if (allergyForbidden) {
        if (logger) {
          console.log(`[Recommend] ${place.place_name}: EXCLUDED due to allergen conflict`)
        }
        continue
      }

      // 3. Score using category fit
      const categoryScore = categoryFit(
        { menuTags: tags, categoryStrength: strength },
        userPreferences,
        weather
      )

      // 4. Find matching dishes from dataset
      let matchedDish: Dish | undefined
      const dishMatches = await matchByTags(tags)
      if (dishMatches.length > 0) {
        // Pick the first matching dish
        matchedDish = dishMatches[0]
      } else if (levels.length > 0) {
        // Try category-based matching
        const categoryDishes = await getDishesbyCategory(levels[levels.length - 1] || levels[0])
        if (categoryDishes.length > 0) {
          matchedDish = categoryDishes[0]
        }
      }

      // 5. Apply dataset weights if dish found
      let finalScore = categoryScore
      if (matchedDish && weather) {
        const weights = matchedDish.weights
        let weatherBonus = 0

        // Weather bonuses
        if (weather.wet && weights.weather?.rainy) {
          weatherBonus += weights.weather.rainy * 0.1
        }
        if (weather.feels_cold && weights.weather?.snowy) {
          weatherBonus += weights.weather.snowy * 0.1
        }
        if (weather.hot_peak && weights.weather?.sunny) {
          weatherBonus += weights.weather.sunny * 0.1
        }

        finalScore += weatherBonus
      }

      // 6. Distance penalty
      const distancePenalty = Math.min(place.distance / 1000 * 0.05, 0.2)
      finalScore = Math.max(0, finalScore - distancePenalty)

      // 7. Generate reason
      let reason = ''
      if (strength === 'leaf') {
        reason = '업종 기반 정확한 매칭'
      } else if (strength === 'mid') {
        reason = '업종 기반 일반 매칭'
      } else {
        reason = '거리 기반 추천'
      }

      if (matchedDish) {
        reason += `, ${matchedDish.name_ko} 특성 반영`
      }

      if (weather.wet || weather.feels_cold) {
        reason += ', 날씨 고려'
      }

      // 8. Calculate ETA (simple walking speed estimation)
      const etaMins = Math.max(1, Math.round(place.distance / 80)) // 80m/min walking speed

      // 9. Generate badges
      const badges: string[] = []
      if (strength === 'leaf') badges.push('정확한 매칭')
      if (matchedDish) badges.push('메뉴 정보')
      if (weather && (weather.wet || weather.feels_cold) && tags.some(t => ['soup', 'warm'].includes(t))) {
        badges.push('날씨 추천')
      }

      results.push({
        restaurant: {
          id: place.id,
          name: place.place_name,
          lat: place.lat,
          lng: place.lng,
          distanceM: place.distance,
          categoryStrength: strength,
          menuTags: tags
        },
        reason,
        score: finalScore,
        etaMins,
        badges
      })

      if (logger) {
        console.log(`[Recommend] ${place.place_name}: score=${finalScore.toFixed(3)}, reason="${reason}"`)
      }

    } catch (error) {
      console.error(`[Recommend] Error processing ${place.place_name}:`, error)
      continue
    }
  }

  // Sort by score descending and return top results
  results.sort((a, b) => b.score - a.score)
  const topResults = results.slice(0, maxResults)

  if (logger) {
    console.log(`[Recommend] Final results: ${topResults.length}/${results.length}`)
    topResults.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.restaurant.name} (score: ${r.score.toFixed(3)}, tags: ${r.restaurant.menuTags.join(',')})`)
    })
  }

  return topResults
}

// Weather merging and flag derivation (from existing tests)
export function mergeWeather(
  live?: any,
  ultra?: any,
  short?: any
): any {
  // Priority: live > ultra > short
  const merged = { ...short, ...ultra, ...live }

  // Provide safe defaults
  return {
    T1H: merged.T1H ?? merged.TMP ?? merged.temperature ?? 15,
    REH: merged.REH ?? merged.humidity ?? 50,
    RN1: merged.RN1 ?? merged.PCP ?? merged.precipitation ?? 0,
    WSD: merged.WSD ?? merged.windSpeed ?? 1.5,
    ...merged
  }
}

export function deriveFlags(weather: any): WeatherFlags {
  const temp = weather.T1H ?? weather.TMP ?? weather.temperature ?? 15
  const humidity = weather.REH ?? weather.humidity ?? 50
  const precipitation = weather.RN1 ?? weather.PCP ?? weather.precipitation ?? 0
  const windSpeed = weather.WSD ?? weather.windSpeed ?? 1.5

  return {
    wet: precipitation > 0.5,
    feels_cold: temp < 10,
    muggy: humidity > 80,
    windy: windSpeed > 5,
    clear: precipitation === 0 && humidity < 60,
    hot_peak: temp > 30,
    cold_min: temp < 0
  }
}