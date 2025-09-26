'use client';

import { useEffect, useState } from 'react';
import { MapPin, ThumbsDown, ThumbsUp } from 'lucide-react';
import { getCoords } from '@/lib/client/geo';
import { loadNearby, type NearbyPlace } from '@/lib/client/places';
import { getRecommendations } from '../../lib/recommend';
import type { RecommendationResult, Restaurant } from '../../lib/types';
import { addVisit } from '../../lib/store';

function mapCategoryFromPath(path: string[]): Restaurant['category'] {
  const normalized = path.join(' ').toLowerCase();
  if (normalized.includes('일식') || normalized.includes('japan')) return 'japanese';
  if (normalized.includes('중식') || normalized.includes('중국') || normalized.includes('china')) return 'chinese';
  if (normalized.includes('베트남') || normalized.includes('vietnam')) return 'vietnamese';
  if (normalized.includes('인도') || normalized.includes('india')) return 'indian';
  return 'korean';
}

function toRestaurant(place: NearbyPlace): Restaurant {
  const categoryLevels = place.categoryPath.filter(Boolean);
  const tags = Array.from(
    new Set(
      categoryLevels
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLowerCase())
    )
  );
  const distanceM = typeof place.distanceM === 'number' ? place.distanceM : undefined;
  const etaMins = distanceM ? Math.max(3, Math.round(distanceM / 70)) : 5;

  return {
    id: place.id,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: mapCategoryFromPath(place.categoryPath),
    price_tier: 3,
    tags,
    allergens: [],
    macros: { kcal: 500, protein: 20, fat: 15, carb: 60 },
    season: ['spring', 'summer', 'autumn', 'winter'],
    etaMins,
    distanceM,
    category_name: categoryLevels.length ? categoryLevels.join(' > ') : undefined,
    categoryLevels,
    menuTags: tags,
  };
}

function toRestaurants(places: NearbyPlace[]): Restaurant[] {
  return places.map(toRestaurant);
}

export default function HomePage() {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { lat, lng } = await getCoords();
        const nearby = await loadNearby(lat, lng, 900);
        const restaurants = toRestaurants(nearby);
        const results = getRecommendations(restaurants);
        if (!cancelled) {
          setCurrentIndex(0);
          setRecommendations(results);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || String(e));
          setRecommendations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const nextCard = () => setCurrentIndex((v) => v + 1);

  const handleLike = () => {
    if (currentIndex >= recommendations.length) return;
    const current = recommendations[currentIndex];
    addVisit({ restaurantId: current.restaurant.id, timestamp: Date.now(), liked: true });
    nextCard();
  };

  const handleDislike = () => {
    if (currentIndex >= recommendations.length) return;
    const current = recommendations[currentIndex];
    addVisit({ restaurantId: current.restaurant.id, timestamp: Date.now(), liked: false });
    nextCard();
  };

  const openKakaoMap = (lat: number, lng: number, name: string) => {
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
    window.open(kakaoUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-semibold">추천을 불러오지 못했어요.</p>
          <p className="mt-2 text-sm">{err}</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= recommendations.length || recommendations.length === 0) {
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
  const displayCategory = current.restaurant.category_name ?? current.restaurant.category;
  const displayTags = Array.isArray(current.restaurant.tags) ? current.restaurant.tags : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">점심 추천</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2">{current.restaurant.name}</h2>
          <p className="text-gray-600 mb-3">{current.reason}</p>

          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {displayCategory && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {displayCategory}
                </span>
              )}
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                가격대 {current.restaurant.price_tier}
              </span>
              {typeof current.etaMins === 'number' && (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">
                  예상 {current.etaMins}분
                </span>
              )}
              {typeof current.restaurant.distanceM === 'number' && (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">
                  약 {Math.round(current.restaurant.distanceM)}m
                </span>
              )}
            </div>

            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayTags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {current.restaurant.macros && (
              <div className="text-sm text-gray-600">
                <p>칼로리: {current.restaurant.macros.kcal}kcal</p>
                <p>
                  단백질: {current.restaurant.macros.protein}g | 지방: {current.restaurant.macros.fat}g | 탄수화물:{' '}
                  {current.restaurant.macros.carb}g
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDislike}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600"
            >
              <ThumbsDown size={20} /> 패스
            </button>

            <button
              onClick={() => openKakaoMap(current.restaurant.lat, current.restaurant.lng, current.restaurant.name)}
              className="flex items-center justify-center bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600"
              aria-label="카카오맵 열기"
            >
              <MapPin size={20} />
            </button>

            <button
              onClick={handleLike}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600"
            >
              <ThumbsUp size={20} /> 좋아요
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
