'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getPreferences, setPreferences } from '../../../lib/store';
import { Pref } from '../../../lib/types';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Pref>({
    mode: 'light',
    allergies: [],
    dislikes: [],
    groupSize: 1,
    weather: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentPrefs = getPreferences();
    setPrefs(currentPrefs);
    setLoading(false);
  }, []);

  const handleModeChange = (mode: 'light' | 'heavy') => {
    const updated = { ...prefs, mode };
    setPrefs(updated);
    setPreferences(updated);
  };

  const handleGroupSizeChange = (groupSize: number) => {
    const updated = { ...prefs, groupSize };
    setPrefs(updated);
    setPreferences(updated);
  };

  const handleWeatherToggle = () => {
    const updated = { ...prefs, weather: !prefs.weather };
    setPrefs(updated);
    setPreferences(updated);
  };

  const handleAllergyToggle = (allergy: string) => {
    const allergies = prefs.allergies.includes(allergy)
      ? prefs.allergies.filter(a => a !== allergy)
      : [...prefs.allergies, allergy];
    const updated = { ...prefs, allergies };
    setPrefs(updated);
    setPreferences(updated);
  };

  const handleDislikeToggle = (dislike: string) => {
    const dislikes = prefs.dislikes.includes(dislike)
      ? prefs.dislikes.filter(d => d !== dislike)
      : [...prefs.dislikes, dislike];
    const updated = { ...prefs, dislikes };
    setPrefs(updated);
    setPreferences(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-700">로딩</div>
      </div>
    );
  }

  const commonAllergies = ['soy', 'wheat', 'dairy', 'egg', 'shellfish', 'sesame'];
  const commonDislikes = ['spicy', 'seafood', 'vegetables', 'meat'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <a href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2">
            <ArrowLeft size={20} className="text-gray-600" />
          </a>
          <h1 className="text-xl font-bold text-gray-800">설정</h1>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* 식사 모드 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">식사 모드</h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleModeChange('light')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  prefs.mode === 'light'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                가벼운 식사
              </button>
              <button
                onClick={() => handleModeChange('heavy')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  prefs.mode === 'heavy'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                든든한 식사
              </button>
            </div>
          </div>

          {/* 인원 수 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">인원 수</h2>
            <input
              type="number"
              min="1"
              max="10"
              value={prefs.groupSize}
              onChange={(e) => handleGroupSizeChange(parseInt(e.target.value) || 1)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 날씨 반영 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">날씨 반영</h2>
                <p className="text-sm text-gray-600 mt-1">날씨에 따른 메뉴 추천</p>
              </div>
              <button
                onClick={handleWeatherToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs.weather ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.weather ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 알레르기 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">알레르기</h2>
            <div className="grid grid-cols-2 gap-3">
              {commonAllergies.map(allergy => (
                <button
                  key={allergy}
                  onClick={() => handleAllergyToggle(allergy)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    prefs.allergies.includes(allergy)
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {allergy}
                </button>
              ))}
            </div>
          </div>

          {/* 비선호 음식 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">비선호 음식</h2>
            <div className="grid grid-cols-2 gap-3">
              {commonDislikes.map(dislike => (
                <button
                  key={dislike}
                  onClick={() => handleDislikeToggle(dislike)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    prefs.dislikes.includes(dislike)
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dislike}
                </button>
              ))}
            </div>
          </div>

          {/* 홈으로 버튼 */}
          <div className="pt-4">
            <a
              href="/"
              className="block w-full bg-blue-500 text-white text-center py-4 px-6 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-sm"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}