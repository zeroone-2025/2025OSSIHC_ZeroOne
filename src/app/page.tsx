"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWeatherTheme } from "@/theme/WeatherThemeContext";

export default function Home() {
  const router = useRouter();
  const { setThemeFromFlags } = useWeatherTheme();

  useEffect(() => {
    // 홈 렌더링 시 날씨 API 호출하여 테마 설정
    async function fetchWeatherAndSetTheme() {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (typeof navigator === "undefined" || !navigator.geolocation) {
            reject(new Error("위치 정보를 사용할 수 없습니다."));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000
          });
        });

        const response = await fetch(`/api/weather/live?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
        if (response.ok) {
          const data = await response.json();
          // 날씨 데이터를 기반으로 flags 생성 (예시)
          const flags = generateWeatherFlags(data.raw);
          setThemeFromFlags(flags);
        } else {
          // API 실패 시 기본 테마
          setThemeFromFlags([]);
        }
      } catch (error) {
        console.warn("Weather API failed, using default theme", error);
        setThemeFromFlags([]);
      }
    }

    fetchWeatherAndSetTheme();
  }, [setThemeFromFlags]);

  // 날씨 데이터를 flags로 변환하는 함수
  function generateWeatherFlags(raw: any): string[] {
    const flags: string[] = [];

    if (!raw) return flags;

    // 온도 기반
    if (typeof raw.T1H === 'number') {
      if (raw.T1H >= 28) flags.push('hot');
      if (raw.T1H <= 5) flags.push('cold');
    }

    // 강수 형태
    if (raw.PTY) {
      if (raw.PTY === 1 || raw.PTY === 4) flags.push('rain');
      if (raw.PTY === 2 || raw.PTY === 3) flags.push('snow');
    }

    // 하늘 상태
    if (raw.SKY) {
      if (raw.SKY >= 3) flags.push('cloudy');
    }

    // 습도
    if (typeof raw.REH === 'number' && raw.REH >= 80) {
      flags.push('humid');
    }

    // 풍속
    if (typeof raw.WSD === 'number' && raw.WSD >= 4) {
      flags.push('windy');
    }

    return flags;
  }

  return (
    <div className="min-h-screen relative flex h-screen w-full flex-col justify-between font-display transition-colors duration-500" style={{ color: 'var(--app-fg)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-6 py-4 backdrop-blur-md transition-colors duration-500" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--app-fg)' }}>
        <div className="mx-auto max-w-md flex items-center justify-between">
          <button
            className="h-12 w-12 grid place-items-center rounded-full shadow-lg transition-colors duration-500"
            style={{ backgroundColor: 'var(--app-accent)', opacity: 0.8 }}
            onClick={() => location.reload()}
            aria-label="새로고침"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm text-white">refresh</span>
          </button>
          <span className="text-base font-bold truncate drop-shadow-sm" style={{ color: 'var(--app-fg)' }}>군산시 명산동</span>
          <button
            className="h-12 w-12 grid place-items-center rounded-full shadow-lg transition-colors duration-500"
            style={{ backgroundColor: 'var(--app-accent)', opacity: 0.8 }}
            aria-label="프로필"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm text-white">person</span>
          </button>
        </div>
      </header>

      {/* Center big round button */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push("/recommendation")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push("/recommendation");
            }
          }}
          className="rounded-full aspect-square w-72 shadow-2xl ring-2 grid place-items-center cursor-pointer select-none transition-all duration-500 hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, var(--app-accent), var(--app-bg-to))`,
            borderColor: 'var(--app-accent)'
          }}
          aria-label="점심 메뉴 추천으로 이동"
        >
          <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-center">
            <span className="material-symbols-outlined text-8xl mb-2 block">restaurant_menu</span>
            <p className="text-xl font-extrabold tracking-tight">점심 메뉴 추천</p>
          </div>
        </div>
      </main>

      {/* Bottom weather card (placeholder) */}
      <footer className="px-6 pb-8">
        <div className="mx-auto max-w-md rounded-xl shadow-lg backdrop-blur p-6 transition-colors duration-500" style={{ backgroundColor: 'var(--app-card)', color: 'var(--app-fg)' }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-base font-semibold opacity-90 mb-3">현재 날씨</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base">
                <p>
                  <span className="font-bold">온도:</span> 25°C
                </p>
                <p>
                  <span className="font-bold">습도:</span> 60%
                </p>
                <p>
                  <span className="font-bold">하늘:</span> 맑음
                </p>
                <p>
                  <span className="font-bold">강수량:</span> 0mm
                </p>
              </div>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-xl shadow-sm transition-colors duration-500" style={{ backgroundColor: 'var(--app-accent)', opacity: 0.3 }}>
              <span className="material-symbols-outlined text-5xl drop-shadow-sm" style={{ color: 'var(--app-accent)' }}>thermostat</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
