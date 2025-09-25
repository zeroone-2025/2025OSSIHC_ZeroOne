'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Cloud, Thermometer, Wind, AlertCircle, RotateCcw } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'
import type { WeatherSnapshot } from '../../../lib/types'

interface WeatherState {
  status: 'loading' | 'success' | 'error'
  data?: WeatherSnapshot
  error?: string
}

export function WeatherCard(): React.ReactElement {
  const [weather, setWeather] = useState<WeatherState>({ status: 'loading' })

  const fetchWeatherData = useCallback(async () => {
    setWeather({ status: 'loading' })

    try {
      // Try live weather first
      let response = await fetch('/api/weather/live')

      if (!response.ok && response.status !== 503) {
        // Fallback to short weather if live fails
        response = await fetch('/api/weather/short')
      }

      if (!response.ok) {
        throw new Error('날씨 정보를 가져올 수 없습니다.')
      }

      const data = await response.json()
      setWeather({ status: 'success', data })
    } catch (error) {
      console.warn('Failed to fetch weather:', error)
      setWeather({
        status: 'error',
        error: error instanceof Error ? error.message : '날씨 정보를 가져오는데 실패했습니다.'
      })
    }
  }, [])

  useEffect(() => {
    fetchWeatherData()
  }, [fetchWeatherData])

  const handleRetry = useCallback(() => {
    fetchWeatherData()
  }, [fetchWeatherData])

  const formatTemperature = (temp: number | undefined): string => {
    return temp ? `${Math.round(temp)}°C` : '15°C'
  }

  const formatWindSpeed = (speed: number | undefined): string => {
    return speed ? `${Math.round(speed)}m/s` : '1m/s'
  }

  const formatPrecipitation = (data: WeatherSnapshot): string => {
    if (data.RN1 && data.RN1 > 0) {
      return `${data.RN1}mm`
    }
    if (data.PCP && parseFloat(data.PCP) > 0) {
      return `${data.PCP}mm`
    }
    if (data.flags?.wet) {
      return '강수'
    }
    return ''
  }

  const getWeatherBadges = (data: WeatherSnapshot) => {
    const badges: Array<{ icon: React.ReactElement; text: string; color: string }> = []

    // Temperature
    const temp = data.T1H ?? data.TMP ?? 15
    badges.push({
      icon: <Thermometer size={14} />,
      text: formatTemperature(temp),
      color: 'text-brand'
    })

    // Precipitation
    const precipText = formatPrecipitation(data)
    if (precipText) {
      badges.push({
        icon: <Cloud size={14} />,
        text: precipText,
        color: 'text-blue-600'
      })
    }

    // Wind
    badges.push({
      icon: <Wind size={14} />,
      text: formatWindSpeed(data.WSD ?? 1.5),
      color: 'text-gray-600'
    })

    return badges
  }

  if (weather.status === 'loading') {
    return (
      <Card tone="soft" className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">현재 날씨</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-7 w-16 bg-gray-200 rounded-full"
            />
          ))}
        </div>
      </Card>
    )
  }

  if (weather.status === 'error') {
    return (
      <Card tone="soft" className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">현재 날씨</h2>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="h-8 w-8 text-brand-sub1 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">{weather.error}</p>
          <Button
            onClick={handleRetry}
            className="text-xs px-3 py-2 rounded-full bg-brand-sub1 text-white hover:bg-brand-sub1/90 inline-flex items-center gap-1 min-h-[44px]"
          >
            <RotateCcw className="h-3 w-3" />
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  const badges = getWeatherBadges(weather.data!)

  return (
    <Card tone="soft" className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Cloud className="h-5 w-5 text-brand" />
        <h2 className="text-lg font-bold text-gray-900">현재 날씨</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {badges.map((badge, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 rounded-full border border-brand-sub2/60 bg-white px-3 py-2 shadow-sm text-xs font-medium ${badge.color} min-h-[44px]`}
          >
            {badge.icon}
            {badge.text}
          </span>
        ))}
      </div>

      {weather.data?.flags && Object.values(weather.data.flags).some(Boolean) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {weather.data.flags.hot && (
              <span className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                더움
              </span>
            )}
            {weather.data.flags.cold && (
              <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                추움
              </span>
            )}
            {weather.data.flags.wet && (
              <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                습함
              </span>
            )}
            {weather.data.flags.windy && (
              <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-full border border-gray-200">
                바람
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}