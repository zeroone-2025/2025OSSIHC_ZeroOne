'use client';

import { useEffect, useRef, useState } from 'react';

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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6">지도</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
          <div className="mt-6 text-center">
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">지도</h1>

        {loading && (
          <div className="text-center mb-4">
            <div className="text-lg">로딩</div>
          </div>
        )}

        <div
          ref={mapContainer}
          className="w-full bg-gray-200 rounded-lg"
          style={{ height: '70vh' }}
        />

        <div className="mt-6 text-center">
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