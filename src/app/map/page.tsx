'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '../_components/Card';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    if (!kakaoKey) {
      setError('Kakao API 키가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_KAKAO_JS_KEY를 설정하세요.');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (mapContainer.current) {
          const options = {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청 좌표
            level: 3
          };

          new window.kakao.maps.Map(mapContainer.current, options);
          setLoading(false);
        }
      });
    };

    script.onerror = () => {
      setError('Kakao 지도 스크립트를 로드할 수 없습니다.');
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  if (error) {
    return (
      <div className="section space-y-4">
        <Card tone="lifted" className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">지도</h1>
          <div className="rounded-xl border border-critical/40 bg-critical/10 px-4 py-3 text-critical">
            <p>{error}</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-brand-sub1 px-6 py-3 text-sm font-semibold text-brand-sub1 shadow-card hover:bg-brand-sub2/30"
          >
            홈으로
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="section space-y-4">
      <Card tone="soft" className="space-y-2 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">지도</h1>
        {loading && <div className="text-brand-sub1">로딩</div>}
      </Card>

      <Card tone="lifted" className="p-3">
        <div
          ref={mapContainer}
          className="h-[70vh] w-full rounded-xl border border-brand-sub1/60 bg-brand-bg"
        />
      </Card>

      <Card tone="soft" className="p-4 text-center">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-brand-sub1 px-6 py-3 text-sm font-semibold text-brand-sub1 shadow-card hover:bg-brand-sub2/30"
        >
          홈으로
        </a>
      </Card>
    </div>
  );
}
