'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { Restaurant, RecommendationResult } from '../../lib/types';
import { getRecommendations } from '../../lib/recommend';
import { addVisit } from '../../lib/store';

export default function HomePage() {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const response = await fetch('/data/restaurants.json');
        const restaurants: Restaurant[] = await response.json();
        const results = getRecommendations(restaurants);
        setRecommendations(results);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, []);

  const handleLike = () => {
    if (currentIndex >= recommendations.length) return;

    const current = recommendations[currentIndex];
    addVisit({
      restaurantId: current.restaurant.id,
      timestamp: Date.now(),
      liked: true
    });

    nextCard();
  };

  const handleDislike = () => {
    if (currentIndex >= recommendations.length) return;

    const current = recommendations[currentIndex];
    addVisit({
      restaurantId: current.restaurant.id,
      timestamp: Date.now(),
      liked: false
    });

    nextCard();
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const openKakaoMap = (lat: number, lng: number, name: string) => {
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
    window.open(kakaoUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩</div>
      </div>
    );
  }

  if (currentIndex >= recommendations.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">추천 완료!</h2>
          <p className="text-gray-600">새로운 추천을 받으려면 새로고침하세요.</p>
        </div>
      </div>
    );
  }

  const current = recommendations[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">점심 추천</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2">{current.restaurant.name}</h2>
          <p className="text-gray-600 mb-3">{current.reason}</p>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {current.restaurant.category}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                {current.restaurant.price_tier}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {current.restaurant.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              <p>칼로리: {current.restaurant.macros.kcal}kcal</p>
              <p>단백질: {current.restaurant.macros.protein}g |
                 지방: {current.restaurant.macros.fat}g |
                 탄수화물: {current.restaurant.macros.carb}g</p>
              <p>예상 시간: {current.etaMins}분</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDislike}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600"
            >
              <ThumbsDown size={20} />
              패스
            </button>

            <button
              onClick={() => openKakaoMap(
                current.restaurant.lat,
                current.restaurant.lng,
                current.restaurant.name
              )}
              className="flex items-center justify-center bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600"
            >
              <MapPin size={20} />
            </button>

            <button
              onClick={handleLike}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600"
            >
              <ThumbsUp size={20} />
              좋아요
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          {currentIndex + 1} / {recommendations.length}
        </div>
      </div>
    </div>
  );
}