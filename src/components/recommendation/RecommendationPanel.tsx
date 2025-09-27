'use client';
import { useRecommendation } from '@/hooks/useRecommendation';
import { WeatherBadgeList } from '@/components/weather/WeatherBadgeList';
import { Card, CardTitle } from '@/components/ui/Card';
import { MenuList } from '@/components/recommendation/MenuList';
import type { LatLng } from '@/types';

export function RecommendationPanel({ coords }: { coords: LatLng }) {
  const { data, error, loading } = useRecommendation(coords);

  if (loading) return <div className="grid place-items-center py-12">추천 계산 중…</div>;
  if (error) return <div className="text-red-600">추천 오류: {error}</div>;
  if (!data) return <div className="text-red-600">추천 데이터를 가져올 수 없습니다.</div>;

  return (
    <Card>
      <CardTitle>오늘 점심 추천</CardTitle>
      <p className="text-sm text-gray-600 mb-2">날씨 플래그</p>
      <WeatherBadgeList flags={data.flags} />
      <div className="mt-2">
        <p className="text-sm text-gray-600 mb-2">추천 메뉴</p>
        <MenuList menus={data.menus} />
      </div>
      <p className="mt-4 text-xs text-gray-500">※ 브라우저 위치 권한이 필요합니다. HTTPS 환경에서 가장 안정적입니다.</p>
    </Card>
  );
}
