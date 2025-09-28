'use client';
import type { ReactElement } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { LatLng } from '@/types';

export function GeoGate({
  onReady,
  renderLoading,
  renderError,
}: {
  onReady: (coords: LatLng) => ReactElement;
  renderLoading?: () => ReactElement;
  renderError?: (msg: string) => ReactElement;
}) {
  const { coords, error, loading } = useGeolocation();

  if (loading) return renderLoading ? renderLoading() : <div className="grid place-items-center py-12">위치를 확인 중…</div>;
  if (error) return renderError ? renderError(error) : <div className="text-red-600">위치 오류: {error}</div>;
  if (!coords) return <div className="text-red-600">위치 정보를 가져올 수 없습니다.</div>;
  return onReady(coords);
}
