'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { MapPin, Navigation, AlertCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Card } from './Card'
import { Button } from './Button'

interface NearbyRestaurant {
  id: string
  place_name: string
  category_name: string
  distance: string
  x: string
  y: string
  road_address_name?: string
}

interface KakaoPlacesResponse {
  documents: NearbyRestaurant[]
  meta: {
    total_count: number
  }
}

interface LocationState {
  status: 'loading' | 'success' | 'permission-denied' | 'error'
  position?: { lat: number; lng: number }
  error?: string
}

export function NearbyRestaurantsCard(): React.ReactElement {
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([])
  const [location, setLocation] = useState<LocationState>({ status: 'loading' })
  const [isLoading, setIsLoading] = useState(false)

  const fetchNearbyRestaurants = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true)
    try {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_REST_KEY || 'd4ddf7e1ca0e45cfb0ad7eaa2b66f829'
      const radius = 1000
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=8`,
        {
          headers: {
            Authorization: `KakaoAK ${kakaoKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }

      const data: KakaoPlacesResponse = await response.json()
      setRestaurants(data.documents)
    } catch (error) {
      console.warn('Failed to fetch nearby restaurants:', error)
      setRestaurants([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ status: 'error', error: '위치 서비스를 지원하지 않는 브라우저입니다.' })
      return
    }

    setLocation({ status: 'loading' })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        setLocation({ status: 'success', position: { lat, lng } })
        fetchNearbyRestaurants(lat, lng)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocation({ status: 'permission-denied', error: '위치 접근 권한이 필요합니다.' })
            break
          case error.POSITION_UNAVAILABLE:
            setLocation({ status: 'error', error: '위치 정보를 가져올 수 없습니다.' })
            break
          case error.TIMEOUT:
            setLocation({ status: 'error', error: '위치 요청 시간이 초과되었습니다.' })
            break
          default:
            setLocation({ status: 'error', error: '위치를 가져오는데 실패했습니다.' })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분 캐시
      }
    )
  }, [fetchNearbyRestaurants])

  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  const handleRetry = useCallback(() => {
    getUserLocation()
  }, [getUserLocation])

  const formatDistance = (distanceStr: string): string => {
    const distance = parseInt(distanceStr, 10)
    if (distance < 1000) {
      return `${distance}m`
    }
    return `${(distance / 1000).toFixed(1)}km`
  }

  const formatCategory = (category: string): string => {
    return category.split(' > ').pop() || category
  }

  if (location.status === 'loading' || isLoading) {
    return (
      <Card tone="soft" className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">주변 식당</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (location.status === 'permission-denied') {
    return (
      <Card tone="soft" className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">주변 식당</h2>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-brand-sub1 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">위치 권한을 허용해주시면 주변 식당을 찾아드릴게요</p>
          <Button
            onClick={handleRetry}
            className="text-xs px-3 py-2 rounded-full bg-brand text-white hover:bg-brand/90"
          >
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  if (location.status === 'error') {
    return (
      <Card tone="soft" className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">주변 식당</h2>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-brand-sub1 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">{location.error}</p>
          <Button
            onClick={handleRetry}
            className="text-xs px-3 py-2 rounded-full bg-brand-sub1 text-white hover:bg-brand-sub1/90 inline-flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card tone="soft" className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">주변 식당</h2>
        </div>
        <Link
          href="/map"
          className="text-xs font-medium text-brand-sub1 hover:text-brand-sub1/80 min-h-[44px] flex items-center"
        >
          지도로 보기
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">주변에 식당을 찾을 수 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.slice(0, 5).map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-sub2/40 transition-colors min-h-[44px]"
            >
              <Navigation className="h-4 w-4 text-brand-sub1 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm leading-tight truncate">
                  {restaurant.place_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatCategory(restaurant.category_name)}
                  </span>
                  <span className="text-xs text-brand-sub1 font-medium">
                    {formatDistance(restaurant.distance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}