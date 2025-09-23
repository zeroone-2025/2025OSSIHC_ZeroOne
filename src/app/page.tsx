'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MapPin, Settings, History, Cloud, Thermometer, Wind } from 'lucide-react';
import { Restaurant, RecommendationResult, WeatherSnapshot } from '../../lib/types';
import { getRecommendations } from '../../lib/recommend';
import { addVisit } from '../../lib/store';
import { loadMergedWeather } from '../../lib/weather';

export default function HomePage() {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [showWeatherToast, setShowWeatherToast] = useState(false);
  const [question, setQuestion] = useState<{ qId: string; intent: string; question: string; options: string[] } | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        // Get user location
        let lat = 37.5665; // Default: Seoul City Hall
        let lng = 126.9780;

        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false
              });
            });
            lat = position.coords.latitude;
            lng = position.coords.longitude;
          } catch (geoError) {
            console.warn('Geolocation failed, using default location:', geoError);
          }
        }

        // Load data in parallel
        const [restaurantsRes, configRes] = await Promise.all([
          fetch('/data/restaurants.json'),
          fetch('/data/config.json')
        ]);

        const restaurants: Restaurant[] = await restaurantsRes.json();
        const cfg = await configRes.json();
        setAllRestaurants(restaurants);
        setConfig(cfg);

        // Load weather with complete fallback chain
        const mergedWeather = await loadMergedWeather(lat, lng);

        setWeather(mergedWeather);

        // Show toast for bad weather conditions
        if (mergedWeather.flags.wet || mergedWeather.flags.windy) {
          setShowWeatherToast(true);
          setTimeout(() => setShowWeatherToast(false), 5000);
        }

        const results = getRecommendations(restaurants, mergedWeather, cfg);
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

  const askNextQuestion = async () => {
    if (!weather || !allRestaurants.length) return;
    setAsking(true);
    try {
      const topTags = recommendations.length ? recommendations[0].restaurant.tags.slice(0, 3) : allRestaurants[0].tags.slice(0, 3);
      const activeFlags = Object.entries(weather.flags)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);

      const res = await fetch('/api/llm/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: {
            upperTags: topTags,
            weatherFlags: activeFlags,
            previousAnswers: []
          },
          remainingIntents: ['meal_feel', 'time_pressure', 'spice_tolerance', 'group_dyn', 'diet_focus', 'indoor_outdoor', 'distance_tradeoff']
        })
      });
      const data = await res.json();
      setQuestion(data);
    } catch (e) {
      console.warn('질문 생성 실패:', e);
      setQuestion({
        qId: `fallback-${Date.now()}`,
        intent: 'meal_feel',
        question: '오늘 점심은 어떤 느낌으로 드시고 싶으세요?',
        options: ['든든하게', '가볍게', '빠르게', '새로운 맛']
      });
    } finally {
      setAsking(false);
    }
  };

  const applyAnswer = (option: string) => {
    if (!allRestaurants.length) return;

    let filtered = allRestaurants.slice();
    const opt = option.toLowerCase();

    // Simple heuristics to narrow candidates
    if (opt.includes('가볍') || opt.includes('light') || opt.includes('salad')) {
      filtered = filtered.filter(r => r.tags.includes('light') || r.tags.includes('salad') || r.macros.kcal < 450);
    } else if (opt.includes('든든') || opt.includes('protein') || opt.includes('고기') || opt.includes('meat') || opt.includes('hearty')) {
      filtered = filtered.filter(r => r.macros.protein > 20 || r.tags.includes('meat') || r.tags.includes('hearty'));
    } else if (opt.includes('빠르') || opt.includes('quick') || opt.includes('fast')) {
      filtered = filtered.filter(r => r.price_tier <= 2);
    } else if (opt.includes('국') || opt.includes('따뜻') || opt.includes('soup') || opt.includes('warm')) {
      filtered = filtered.filter(r => r.tags.includes('soup') || r.tags.includes('warm'));
    }

    const newRecs = getRecommendations(filtered.length ? filtered : allRestaurants, weather || undefined, config || undefined);
    setRecommendations(newRecs);
    setCurrentIndex(0);
    setQuestion(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-700">로딩</div>
      </div>
    );
  }

  if (currentIndex >= recommendations.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-md p-8 max-w-md mx-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">추천 완료!</h2>
          <p className="text-gray-600 mb-6">새로운 추천을 받으려면 새로고침하세요.</p>
          <div className="flex gap-3 justify-center">
            <a href="/settings" className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
              <Settings size={16} />
              설정
            </a>
            <a href="/history" className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors">
              <History size={16} />
              기록
            </a>
          </div>
        </div>
      </div>
    );
  }

  const current = recommendations[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-gray-800">점심 추천</h1>
              <div className="flex gap-2">
                <a href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings size={20} className="text-gray-600" />
                </a>
                <a href="/history" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <History size={20} className="text-gray-600" />
                </a>
                <button
                  onClick={askNextQuestion}
                  disabled={asking}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="다음 질문"
                >
                  {asking ? '…' : 'Q'}
                </button>
              </div>
            </div>

          {/* Weather mini badges */}
          {weather && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                <Thermometer size={12} />
                <span>{Math.round(weather.T1H || weather.TMP || 15)}°C</span>
              </div>
              {(weather.RN1 || weather.PCP) && (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  <Cloud size={12} />
                  <span>{weather.RN1 || weather.PCP}mm</span>
                </div>
              )}
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                <Wind size={12} />
                <span>{Math.round(weather.WSD || 1.5)}m/s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weather Toast */}
      {showWeatherToast && (
        <div className="fixed top-20 left-4 right-4 bg-orange-500 text-white px-4 py-3 rounded-xl shadow-lg z-20 max-w-md mx-auto">
          <p className="text-sm text-center">
            {weather?.flags.wet && weather?.flags.windy ? '비바람으로' :
             weather?.flags.wet ? '비 예보로' : '강풍으로'} 가까운 곳을 우선 추천합니다
          </p>
        </div>
      )}

      {/* Question panel */}
      {question && (
        <div className="fixed top-20 left-0 right-0 z-20">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-md p-4 border border-blue-200">
              <div className="text-sm text-gray-500 mb-1">다음 질문</div>
              <div className="font-semibold text-gray-800 mb-3">{question.question}</div>
              <div className="grid grid-cols-2 gap-2">
                {question.options.slice(0,4).map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => applyAnswer(opt)}
                    className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-3 text-gray-800">{current.restaurant.name}</h2>

              {/* Reason badges */}
              <div className="mb-4">
                {current.reason.split(' · ').map((reason, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                    {reason}
                  </span>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                    {current.restaurant.category}
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                    {current.restaurant.price_tier === 1 ? '저렴' : current.restaurant.price_tier === 2 ? '보통' : '고급'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {current.restaurant.tags.map(tag => (
                    <span key={tag} className="bg-gray-50 text-gray-600 px-2 py-1 rounded-lg text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    <div>칼로리: {current.restaurant.macros.kcal}kcal</div>
                    <div>단백질: {current.restaurant.macros.protein}g</div>
                    <div>지방: {current.restaurant.macros.fat}g</div>
                    <div>탄수화물: {current.restaurant.macros.carb}g</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    예상 시간: {current.etaMins}분
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDislike}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-4 px-4 rounded-xl hover:bg-red-600 active:scale-95 transition-all duration-150 shadow-sm"
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
                  className="flex items-center justify-center bg-yellow-500 text-white py-4 px-4 rounded-xl hover:bg-yellow-600 active:scale-95 transition-all duration-150 shadow-sm"
                >
                  <MapPin size={20} />
                </button>

                <button
                  onClick={handleLike}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-4 px-4 rounded-xl hover:bg-green-600 active:scale-95 transition-all duration-150 shadow-sm"
                >
                  <ThumbsUp size={20} />
                  좋아요
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            {currentIndex + 1} / {recommendations.length}
          </div>
        </div>
      </div>
    </div>
  );
}
