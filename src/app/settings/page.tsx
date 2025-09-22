'use client';

import { useState, useEffect } from 'react';
import { getPreferences, setPreferences } from '../../../lib/store';
import { Pref } from '../../../lib/types';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Pref>({
    mode: 'light',
    allergens: [],
    dislikes: [],
    groupSize: 1
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

  const handleAllergenToggle = (allergen: string) => {
    const allergens = prefs.allergens.includes(allergen)
      ? prefs.allergens.filter(a => a !== allergen)
      : [...prefs.allergens, allergen];
    const updated = { ...prefs, allergens };
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩</div>
      </div>
    );
  }

  const commonAllergens = ['soy', 'wheat', 'dairy', 'egg', 'shellfish', 'sesame'];
  const commonDislikes = ['spicy', 'seafood', 'vegetables', 'meat'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">설정</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">식사 모드</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('light')}
              className={`flex-1 py-2 px-4 rounded ${
                prefs.mode === 'light'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              가벼운 식사
            </button>
            <button
              onClick={() => handleModeChange('heavy')}
              className={`flex-1 py-2 px-4 rounded ${
                prefs.mode === 'heavy'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              든든한 식사
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">인원 수</h2>
          <input
            type="number"
            min="1"
            max="10"
            value={prefs.groupSize}
            onChange={(e) => handleGroupSizeChange(parseInt(e.target.value) || 1)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">알레르기</h2>
          <div className="grid grid-cols-2 gap-2">
            {commonAllergens.map(allergen => (
              <button
                key={allergen}
                onClick={() => handleAllergenToggle(allergen)}
                className={`p-2 rounded text-sm ${
                  prefs.allergens.includes(allergen)
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">비선호 음식</h2>
          <div className="grid grid-cols-2 gap-2">
            {commonDislikes.map(dislike => (
              <button
                key={dislike}
                onClick={() => handleDislikeToggle(dislike)}
                className={`p-2 rounded text-sm ${
                  prefs.dislikes.includes(dislike)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {dislike}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  );
}