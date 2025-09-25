'use client'

import React from 'react'
import { Clock, DollarSign, Heart } from 'lucide-react'
import { mapMaxPriceToTier, formatPriceTier, formatTimePressure, formatMoodFactors, mapMealFeel, type TimePressure } from '../../../lib/mapping'

interface SessionReasonProps {
  maxPrice?: number
  timePressure?: TimePressure
  mealFeel?: string[]
}

export function ReasonChips({ maxPrice, timePressure, mealFeel }: SessionReasonProps) {
  const chips: Array<{ icon: React.ReactElement; text: string; color: string }> = []

  // Budget chip
  if (maxPrice) {
    const tier = mapMaxPriceToTier(maxPrice)
    chips.push({
      icon: <DollarSign size={14} />,
      text: `예산 ${formatPriceTier(tier)}`,
      color: 'text-green-600 border-green-200 bg-green-50'
    })
  }

  // Time pressure chip
  if (timePressure) {
    const urgencyColor = timePressure === 'rush' ? 'text-red-600 border-red-200 bg-red-50' :
                        timePressure === 'normal' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                        'text-gray-600 border-gray-200 bg-gray-50'

    chips.push({
      icon: <Clock size={14} />,
      text: `시간 ${formatTimePressure(timePressure)}`,
      color: urgencyColor
    })
  }

  // Meal feel chips
  if (mealFeel && mealFeel.length > 0) {
    const mood = mapMealFeel(mealFeel)
    const moodLabels = formatMoodFactors(mood)

    if (moodLabels.length > 0) {
      chips.push({
        icon: <Heart size={14} />,
        text: `느낌 ${moodLabels.join('·')}`,
        color: 'text-purple-600 border-purple-200 bg-purple-50'
      })
    }
  }

  if (chips.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <span
          key={index}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${chip.color}`}
        >
          {chip.icon}
          {chip.text}
        </span>
      ))}
    </div>
  )
}