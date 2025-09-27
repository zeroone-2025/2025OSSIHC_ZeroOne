'use client';
import { Header } from '@/components/layout/Header';
import { GeoGate } from '@/components/location/GeoGate';
import { RecommendationPanel } from '@/components/recommendation/RecommendationPanel';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-6">
        <GeoGate
          onReady={(coords) => <RecommendationPanel coords={coords} />}
          renderLoading={() => <div className="grid place-items-center py-24">현재 위치를 확인 중…</div>}
          renderError={(msg) => <div className="grid place-items-center py-24 text-red-600">위치 권한이 필요합니다: {msg}</div>}
        />
      </main>
    </div>
  );
}
