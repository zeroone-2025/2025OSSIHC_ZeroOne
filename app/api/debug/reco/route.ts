import { NextRequest, NextResponse } from 'next/server'
import { getRecommendations, deriveFlags, type PlaceCandidate } from '@/lib/recommend'

// Only allow in non-production environments (but allow during build)
const isProduction = process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE

export async function GET(request: NextRequest) {
  // Check if this is a production environment at runtime
  if (isProduction) {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '37.5665')
    const lng = parseFloat(searchParams.get('lng') || '126.9780')
    const radius = parseInt(searchParams.get('radius') || '800')

    console.log(`[Debug/Reco] Testing with lat=${lat}, lng=${lng}, radius=${radius}`)

    // Mock calling /api/places/search to get Kakao places
    const mockPlaces: PlaceCandidate[] = [
      {
        id: 'test-gukbap',
        place_name: '할머니 국밥',
        category_name: '음식점 > 한식 > 국밥',
        lat: lat + 0.001,
        lng: lng + 0.001,
        distance: 120,
        categoryPath: ['음식점', '한식', '국밥']
      },
      {
        id: 'test-bunshik',
        place_name: '맛있는 분식',
        category_name: '음식점 > 분식',
        lat: lat + 0.002,
        lng: lng + 0.002,
        distance: 250,
        categoryPath: ['음식점', '분식']
      },
      {
        id: 'test-unknown',
        place_name: '알 수 없는 식당',
        category_name: '음식점 > 기타',
        lat: lat + 0.003,
        lng: lng + 0.003,
        distance: 350,
        categoryPath: ['음식점', '기타']
      },
      {
        id: 'test-shellfish',
        place_name: '해산물 전문점',
        category_name: '음식점 > 한식 > 해산물',
        lat: lat + 0.001,
        lng: lng - 0.001,
        distance: 180,
        categoryPath: ['음식점', '한식', '해산물']
      }
    ]

    // Mock weather (cold and wet)
    const mockWeather = {
      T1H: 5, // Cold
      REH: 85, // High humidity
      RN1: 2.5, // Rainy
      WSD: 3 // Moderate wind
    }

    const weatherFlags = deriveFlags(mockWeather)

    // Mock user preferences with shellfish allergy
    const mockPreferences = {
      allergies: ['갑각류', 'shellfish'],
      dislikes: []
    }

    console.log('[Debug/Reco] Weather flags:', weatherFlags)
    console.log('[Debug/Reco] User preferences:', mockPreferences)

    // Get recommendations with detailed logging
    const results = await getRecommendations(mockPlaces, {
      userPreferences: mockPreferences,
      weather: weatherFlags,
      maxResults: 10,
      logger: true
    })

    // Enhanced debug response with detailed breakdown
    const debugResponse = {
      input: {
        location: { lat, lng, radius },
        weather: { raw: mockWeather, flags: weatherFlags },
        preferences: mockPreferences,
        places: mockPlaces.length
      },
      processing: await Promise.all(mockPlaces.map(async (place) => {
        const { parseCategoryPath, tagsFromCategory } = await import('@/lib/category')
        const { forbidFromAllergy } = await import('@/lib/allergy')
        const { matchByTags } = await import('@/lib/dataset')

        const { levels } = parseCategoryPath(place.category_name)
        const { tags, strength } = tagsFromCategory(levels)
        const allergyHit = forbidFromAllergy(mockPreferences.allergies || [], tags)
        const matchedDish = await matchByTags(tags)

        return {
          place: {
            id: place.id,
            name: place.place_name,
            category: place.category_name,
            distance: place.distance
          },
          categoryParsing: {
            levels,
            tags,
            strength
          },
          allergyHit,
          matchedDish: matchedDish.length > 0 ? {
            id: matchedDish[0].id,
            name: matchedDish[0].name_ko,
            category: matchedDish[0].category,
            weights: matchedDish[0].weights
          } : null,
          scores: {
            // Would include detailed scoring breakdown here
            categoryFit: 'calculated',
            weatherBonus: 'applied',
            distancePenalty: Math.min(place.distance / 1000 * 0.05, 0.2)
          }
        }
      })),
      results: results.map(r => ({
        restaurant: r.restaurant,
        reason: r.reason,
        score: r.score,
        etaMins: r.etaMins,
        badges: r.badges,
        menuTags: r.restaurant.menuTags,
        strength: r.restaurant.categoryStrength
      }))
    }

    return NextResponse.json(debugResponse, { status: 200 })

  } catch (error) {
    console.error('[Debug/Reco] Error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}