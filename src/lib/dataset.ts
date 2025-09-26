import { z } from 'zod'
import fs from 'fs'
import path from 'path'

// Zod schemas for validation
const DishWeightsSchema = z.object({
  weather: z.object({
    sunny: z.number(),
    cloudy: z.number(),
    rainy: z.number(),
    snowy: z.number(),
    temperature: z.number(),
    humidity: z.number(),
    wind: z.number()
  }),
  season: z.object({
    spring: z.number(),
    summer: z.number(),
    autumn: z.number(),
    winter: z.number()
  }),
  day: z.object({
    weekday: z.number(),
    weekend: z.number()
  }),
  mood: z.object({
    happy: z.number(),
    sad: z.number(),
    stressed: z.number(),
    calm: z.number(),
    anxious: z.number()
  })
})

const DishSchema = z.object({
  id: z.string(),
  name_ko: z.string(),
  name_en: z.string(),
  category: z.string(),
  average_price_krw: z.number(),
  price_tier: z.number(),
  ingredients: z.array(z.string()),
  allergens: z.array(z.string()),
  tags: z.array(z.string()),
  weights: DishWeightsSchema
})

export type Dish = z.infer<typeof DishSchema>
export type DishWeights = z.infer<typeof DishWeightsSchema>

const DatasetSchema = z.array(DishSchema)

// Cache interface
interface DatasetCache {
  data: Map<string, Dish>
  loadedAt: number
  ttl: number
}

let cache: DatasetCache | null = null

const CACHE_TTL = process.env.NODE_ENV === 'development' ? 60000 : Infinity // 60s in dev, permanent in prod

/**
 * Loads and validates the jommechu dataset from the filesystem
 * Returns a Map indexed by Korean name for fast lookups
 */
export async function loadDataset(): Promise<Map<string, Dish>> {
  const now = Date.now()

  // Return cached data if valid
  if (cache && (now - cache.loadedAt) < cache.ttl) {
    return cache.data
  }

  try {
    const datasetPath = path.join(process.cwd(), 'public/data/jommechu/jommechu_dataset_v2_full.json')
    const rawData = fs.readFileSync(datasetPath, 'utf-8')
    const parsed = JSON.parse(rawData)

    // Validate with Zod
    const validated = DatasetSchema.parse(parsed)

    // Create Map indexed by Korean name
    const dataMap = new Map<string, Dish>()
    validated.forEach(dish => {
      dataMap.set(dish.name_ko, dish)
      // Also index by ID for flexibility
      dataMap.set(dish.id, dish)
    })

    // Update cache
    cache = {
      data: dataMap,
      loadedAt: now,
      ttl: CACHE_TTL
    }

    console.log(`[Dataset] Loaded ${validated.length} dishes, cached with TTL ${CACHE_TTL}ms`)
    return dataMap

  } catch (error) {
    console.error('[Dataset] Failed to load dataset:', error)
    throw new Error(`Dataset loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get a dish by Korean name
 */
export async function getDishByKoreanName(nameKo: string): Promise<Dish | undefined> {
  const dataset = await loadDataset()
  return dataset.get(nameKo)
}

/**
 * Find dishes that match any of the provided tags
 */
export async function matchByTags(tags: string[]): Promise<Dish[]> {
  const dataset = await loadDataset()
  const matches: Dish[] = []

  const normalizedSearchTags = tags.map(tag => tag.toLowerCase().trim())

  for (const dish of dataset.values()) {
    // Skip duplicates (same dish indexed by both name_ko and id)
    if (matches.some(m => m.id === dish.id)) continue

    const dishTags = dish.tags.map(tag => tag.toLowerCase().trim())
    const hasMatch = normalizedSearchTags.some(searchTag =>
      dishTags.some(dishTag => dishTag.includes(searchTag) || searchTag.includes(dishTag))
    )

    if (hasMatch) {
      matches.push(dish)
    }
  }

  return matches
}

/**
 * Get dishes by category
 */
export async function getDishesbyCategory(category: string): Promise<Dish[]> {
  const dataset = await loadDataset()
  const matches: Dish[] = []

  const normalizedCategory = category.toLowerCase().trim()

  for (const dish of dataset.values()) {
    // Skip duplicates
    if (matches.some(m => m.id === dish.id)) continue

    if (dish.category.toLowerCase().trim() === normalizedCategory) {
      matches.push(dish)
    }
  }

  return matches
}

/**
 * Search dishes by name (partial matching)
 */
export async function searchDishesByName(query: string): Promise<Dish[]> {
  const dataset = await loadDataset()
  const matches: Dish[] = []

  const normalizedQuery = query.toLowerCase().trim()

  for (const dish of dataset.values()) {
    // Skip duplicates
    if (matches.some(m => m.id === dish.id)) continue

    if (dish.name_ko.toLowerCase().includes(normalizedQuery) ||
        dish.name_en.toLowerCase().includes(normalizedQuery)) {
      matches.push(dish)
    }
  }

  return matches
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache = null
  console.log('[Dataset] Cache cleared')
}