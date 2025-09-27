'use client';
import { useEffect, useState } from 'react';
import { type WeatherContext, type WeatherFlags } from '@/lib/reco-core';

interface MenuItem {
  id: string;
  name: string;
  name_en: string;
  category: string;
  score: number;
  tags: string[];
  price_tier: number;
  average_price_krw: number;
}

interface RecoResponse {
  weather: WeatherContext;
  flags: WeatherFlags;
  items: MenuItem[];
  source: string;
  error?: string;
}

const FALLBACK_LAT = 37.5665; // Seoul City Hall
const FALLBACK_LNG = 126.9780;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RecoResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [usedFallbackLocation, setUsedFallbackLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Try to get user's location
        let lat = FALLBACK_LAT;
        let lng = FALLBACK_LNG;

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 300000 // 5 minutes
            })
          );
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          setUsedFallbackLocation(true);
        }

        // Fetch recommendations
        const response = await fetch('/api/reco', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, topN: 5 })
        });

        if (!response.ok) {
          throw new Error(`추천 요청 실패: ${response.status}`);
        }

        const recoData: RecoResponse = await response.json();
        setData(recoData);

      } catch (e: any) {
        setError(e?.message || '알 수 없는 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">날씨 정보를 가져오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">오류 발생</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()}원`;
  };

  const getActiveFlags = (flags: WeatherFlags): string[] => {
    const activeFlags: string[] = [];
    Object.entries(flags).forEach(([key, value]) => {
      if (value > 0.3) { // Only show flags with significant values
        activeFlags.push(key);
      }
    });
    return activeFlags;
  };

  const activeFlags = getActiveFlags(data.flags);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오늘의 맛집 추천</h1>
          <p className="text-sm text-gray-500">
            날씨: {data.weather.temperature}°C, 습도 {data.weather.humidity}%
          </p>
          <p className="text-xs text-gray-400">
            데이터 소스: {data.source === 'kma' ? '기상청' : '기본값'}
          </p>
        </div>

        {usedFallbackLocation && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            ⚠️ 위치 권한이 없어 서울 기준으로 추천했습니다.
          </div>
        )}

        {activeFlags.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">오늘의 날씨 특성</p>
            <div className="flex flex-wrap gap-1">
              {activeFlags.map(flag => (
                <span key={flag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">추천 메뉴</h2>
          {data.items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-blue-600">#{index + 1}</span>
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                </div>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                  {Math.round(item.score * 100)}점
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>카테고리: {item.category}</p>
                <p>평균 가격: {formatPrice(item.average_price_krw)}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-xs text-gray-400">
            날씨 기반 개인화 추천 시스템
          </p>
        </div>
      </div>
    </div>
  );
}
