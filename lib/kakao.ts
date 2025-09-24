import { hasKakaoKey, getEnv } from '@/lib/env'
import { distanceMeters, etaMins } from './geo'

export interface SearchPlacesParams {
  query: string
  x?: number
  y?: number
  radius?: number
  category_group_code?: string
}

export interface KakaoPlace {
  id: string
  name: string
  category_name: string
  category_group_code: string
  x: number
  y: number
  distanceM: number | null
  etaMins: number | null
  phone?: string
  roadAddress?: string
}

interface KakaoDocuments {
  id: string
  place_name: string
  category_name: string
  category_group_code: string
  x: string
  y: string
  distance?: string
  phone?: string
  road_address_name?: string
}

const KAKAO_LOCAL_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'

export async function searchPlaces(params: SearchPlacesParams): Promise<KakaoPlace[]> {
  if (!hasKakaoKey()) {
    return []
  }

  const apiKey = getEnv('KAKAO_API_KEY')
  const searchParams = new URLSearchParams({ query: params.query })

  if (params.x && params.y) {
    searchParams.set('x', String(params.x))
    searchParams.set('y', String(params.y))
  }
  if (params.radius) {
    searchParams.set('radius', String(params.radius))
  }
  if (params.category_group_code) {
    searchParams.set('category_group_code', params.category_group_code)
  }

  const response = await fetch(`${KAKAO_LOCAL_URL}?${searchParams.toString()}`, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  })

  if (!response.ok) {
    if (response.status === 400) {
      return []
    }
    throw new Error(`Kakao search failed: ${response.status}`)
  }

  const data = (await response.json()) as { documents: KakaoDocuments[] }
  const docs = Array.isArray(data.documents) ? data.documents : []

  return docs.map((doc) => normalizePlace(doc, params))
}

function normalizePlace(doc: KakaoDocuments, params: SearchPlacesParams): KakaoPlace {
  const x = Number(doc.x)
  const y = Number(doc.y)
  let distanceM: number | null = null
  let eta: number | null = null

  if (doc.distance) {
    const parsed = Number(doc.distance)
    if (!Number.isNaN(parsed)) {
      distanceM = parsed
      eta = etaMins(parsed)
    }
  } else if (params.x && params.y) {
    distanceM = distanceMeters({ lat: Number(params.y), lng: Number(params.x) }, { lat: y, lng: x })
    eta = etaMins(distanceM)
  }

  return {
    id: doc.id,
    name: doc.place_name,
    category_name: doc.category_name,
    category_group_code: doc.category_group_code,
    x,
    y,
    distanceM,
    etaMins: eta,
    phone: doc.phone,
    roadAddress: doc.road_address_name,
  }
}
