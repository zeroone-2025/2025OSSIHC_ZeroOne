'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '../_components/Card'
import { getPreferences, setPreferences } from '../../../lib/store'
import type { Pref } from '../../../lib/types'

interface OptionList {
  label: string
  value: string
}

export default function ProfilePage(): JSX.Element {
  const [prefs, setPrefs] = useState<Pref>({ allergies: [], dislikes: [], weather: true })
  const [allergyOptions, setAllergyOptions] = useState<OptionList[]>([])
  const [dislikeOptions, setDislikeOptions] = useState<OptionList[]>([])
  const [savedToast, setSavedToast] = useState<string | null>(null)

  useEffect(() => {
    setPrefs(getPreferences())
  }, [])

  useEffect(() => {
    async function loadOptions() {
      try {
        const [allergiesRes, dislikesRes] = await Promise.all([
          fetch('/data/vocab/allergies.ko.json'),
          fetch('/data/vocab/food_dislikes.ko.json'),
        ])
        const allergyList: string[] = await allergiesRes.json()
        const dislikeList: string[] = await dislikesRes.json()
        setAllergyOptions(allergyList.map((item) => ({ label: item, value: item })))
        setDislikeOptions(dislikeList.map((item) => ({ label: item, value: item })))
      } catch (error) {
        console.error('Failed to load vocab list', error)
      }
    }
    loadOptions()
  }, [])

  const toggleAllergy = (value: string) => {
    const allergies = prefs.allergies.includes(value)
      ? prefs.allergies.filter((item) => item !== value)
      : [...prefs.allergies, value]
    const next = { ...prefs, allergies }
    setPrefs(next)
    setPreferences(next)
    setSavedToast('알레르기 정보를 저장했어요.')
  }

  const toggleDislike = (value: string) => {
    const dislikes = prefs.dislikes.includes(value)
      ? prefs.dislikes.filter((item) => item !== value)
      : [...prefs.dislikes, value]
    const next = { ...prefs, dislikes }
    setPrefs(next)
    setPreferences(next)
    setSavedToast('비선호 정보를 저장했어요.')
  }

  const toggleWeather = () => {
    const next = { ...prefs, weather: !prefs.weather }
    setPrefs(next)
    setPreferences(next)
    setSavedToast(next.weather ? '날씨 반영을 켰어요.' : '날씨 반영을 껐어요.')
  }

  useEffect(() => {
    if (!savedToast) return
    const timer = setTimeout(() => setSavedToast(null), 1800)
    return () => clearTimeout(timer)
  }, [savedToast])

  return (
    <div className="section space-y-4">
      <Card tone="soft" className="space-y-2 p-5">
        <h1 className="text-2xl font-bold text-gray-900">개인 프로필</h1>
        <p className="text-sm text-brand/80">식사 모드와 인원수는 LLM 질문에서 자동 수집합니다.</p>
      </Card>

      <Card tone="lifted" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">날씨 반영</h2>
            <p className="text-sm text-brand/80">비·강풍 시 가까운 식당을 우선합니다.</p>
          </div>
          <button
            onClick={toggleWeather}
            className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors ${
              prefs.weather ? 'border-brand bg-brand' : 'border-brand-light/60 bg-white'
            }`}
            aria-pressed={prefs.weather}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                prefs.weather ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      <Card tone="soft" className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">알레르기</h2>
        <p className="text-sm text-brand/80">선택한 알레르기 재료는 추천에서 제외합니다.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {allergyOptions.map((option) => {
            const active = prefs.allergies.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleAllergy(option.value)}
                className={`rounded-full border px-5 py-3 text-sm font-medium transition-all ${
                  active ? 'border-brand bg-brand text-white shadow-sm' : 'border-brand-light/60 bg-white text-brand hover:bg-brand-pale'
                }`}
                style={{ minHeight: 48 }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Card>

      <Card tone="soft" className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">비선호 음식</h2>
        <p className="text-sm text-brand/80">선택한 비선호 태그는 추천 시 감점합니다.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {dislikeOptions.map((option) => {
            const active = prefs.dislikes.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleDislike(option.value)}
                className={`rounded-full border px-5 py-3 text-sm font-medium transition-all ${
                  active ? 'border-brand bg-brand text-white shadow-sm' : 'border-brand-light/60 bg-white text-brand hover:bg-brand-pale'
                }`}
                style={{ minHeight: 48 }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Card>

      {savedToast && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto flex max-w-[320px] items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 size={18} />
          <span>{savedToast}</span>
        </div>
      )}
    </div>
  )
}
