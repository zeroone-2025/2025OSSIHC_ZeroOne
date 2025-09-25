'use client'

import React, { useState, useCallback } from 'react'

interface BudgetSliderProps {
  min?: number
  max?: number
  step?: number
  preset?: number[]
  initialValue?: number
  onChange: (value: number) => void
}

export function BudgetSlider({
  min = 0,
  max = 50000,
  step = 1000,
  preset = [8000, 12000, 20000, 35000],
  initialValue = 15000,
  onChange
}: BudgetSliderProps) {
  const [value, setValue] = useState(initialValue)

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value)
    setValue(newValue)
    onChange(newValue)
  }, [onChange])

  const handlePresetClick = useCallback((presetValue: number) => {
    setValue(presetValue)
    onChange(presetValue)
  }, [onChange])

  const formatPrice = (price: number): string => {
    if (price >= 10000) {
      const man = Math.floor(price / 10000)
      const remainder = price % 10000
      if (remainder === 0) {
        return `₩${man}만`
      } else {
        return `₩${man}.${remainder / 1000}만`
      }
    }
    return `₩${(price / 1000).toFixed(0)}천`
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-brand mb-2">
          {formatPrice(value)}
        </div>
        <div className="text-sm text-gray-600">
          예산 범위: {formatPrice(min)} ~ {formatPrice(max)}
        </div>
      </div>

      <div className="px-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatPrice(min)}</span>
          <span>{formatPrice(max)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-gray-600 text-center">빠른 선택</div>
        <div className="grid grid-cols-2 gap-2">
          {preset.map((presetValue) => (
            <button
              key={presetValue}
              onClick={() => handlePresetClick(presetValue)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                value === presetValue
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formatPrice(presetValue)}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-ms-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}