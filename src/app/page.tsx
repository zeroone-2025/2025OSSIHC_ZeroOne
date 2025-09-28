"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import WeatherBadge from "@/components/WeatherBadge";
import { type ProcessedWeather } from "@/lib/ui/weatherIcon";
import { useWeatherTheme } from "@/theme/WeatherThemeContext";

type LiveWeatherResponse = {
  weights: Record<string, number>;
  raw?: {
    processed?: ProcessedWeather;
    source?: string;
    timeKeyKST?: string;
  };
};

export default function Home() {
  const router = useRouter();
  const { setThemeFromFlags } = useWeatherTheme();
  const [locationStatus, setLocationStatus] = useState<"loading" | "success" | "fallback">("loading");
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [weather, setWeather] = useState<ProcessedWeather | null>(null);
  const [weatherTimeKey, setWeatherTimeKey] = useState<string | null>(null);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>("");

  useEffect(() => {
    // 홈 렌더링 시 날씨 API 호출하여 테마 설정
    async function fetchWeatherAndSetTheme() {
      try {
        console.log("Starting geolocation request...");

        // 위치 정보 가져오기 (개선된 버전)
        const position = await getLocationWithFallback();
        console.log("Location obtained:", position);

        // 위치가 기본값인지 확인
        const isDefaultLocation = position.latitude === 37.5665 && position.longitude === 126.9780;
        setLocationStatus(isDefaultLocation ? "fallback" : "success");

        // 주소 정보 가져오기
        try {
          const geocodeResponse = await fetch(`/api/geocode?lat=${position.latitude}&lng=${position.longitude}`);
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            const displayAddress = geocodeData.dong
              ? `${geocodeData.city} ${geocodeData.district} ${geocodeData.dong}`
              : geocodeData.address || "위치 정보";
            setLocationAddress(displayAddress);
            console.log("Address obtained:", displayAddress);
          } else {
            setLocationAddress(isDefaultLocation ? "서울시청" : "현재 위치");
          }
        } catch (geocodeError) {
          console.warn("Failed to get address:", geocodeError);
          setLocationAddress(isDefaultLocation ? "서울시청" : "현재 위치");
        }

        const response = await fetch(`/api/weather/live?lat=${position.latitude}&lng=${position.longitude}`);
        if (response.ok) {
          const data: LiveWeatherResponse = await response.json();
          console.log("Weather data received:", data);
          const processed = data.raw?.processed ?? null;
          if (processed) {
            setWeather(processed);
            setWeatherTimeKey(data.raw?.timeKeyKST ?? null);
          } else {
            setWeather(null);
            setWeatherTimeKey(null);
          }
          // 날씨 데이터를 기반으로 flags 생성
          const flags = generateWeatherFlags(processed);
          setThemeFromFlags(flags);
        } else {
          console.warn("Weather API failed, using default theme");
          setWeather(null);
          setWeatherTimeKey(null);
          setThemeFromFlags([]);
        }
      } catch (error) {
        console.warn("Failed to get location or weather data:", error);
        setLocationStatus("fallback");
        setWeather(null);
        setWeatherTimeKey(null);
        setThemeFromFlags([]);
      }
    }

    fetchWeatherAndSetTheme();
  }, [setThemeFromFlags]);

  // 실시간 시간 표시 (10분 단위로 내림)
  useEffect(() => {
    function updateCurrentTime() {
      const now = new Date();
      // 현재 시스템이 이미 KST인 경우 그대로 사용

      // 분을 10분 단위로 내림
      const minutes = Math.floor(now.getMinutes() / 10) * 10;
      const hours = now.getHours();

      // HH:MM 형태로 포맷
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setCurrentTimeDisplay(timeString);
    }

    // 초기 실행
    updateCurrentTime();

    // 1분마다 업데이트
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // 개선된 위치 정보 가져오기 함수
  async function getLocationWithFallback(): Promise<{latitude: number, longitude: number}> {
    // 기본 위치 (서울 시청)
    const defaultLocation = { latitude: 37.5665, longitude: 126.9780 };

    // 브라우저 지원 여부 확인
    if (typeof navigator === "undefined") {
      console.warn("Navigator not available (server-side), using default location");
      return defaultLocation;
    }

    if (!navigator.geolocation) {
      console.error("❌ Geolocation API not supported by this browser");
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다. 최신 Chrome, Firefox, Safari를 사용해주세요.");
      return defaultLocation;
    }

    try {
      console.log("🌍 Requesting geolocation permission...");

      // HTTPS 여부 확인
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      console.log("🔐 Is secure context:", isSecure);

      if (!isSecure) {
        console.warn("⚠️ Not in secure context - Geolocation may not work");
        alert("위치 서비스를 사용하려면 HTTPS가 필요합니다. 개발 서버를 HTTPS로 실행해주세요.");
      }

      // 먼저 권한 상태 확인 (지원하는 브라우저에서만)
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({name: 'geolocation'});
          console.log("🔑 Geolocation permission status:", permission.state);

          if (permission.state === 'denied') {
            console.error("❌ Geolocation permission denied");
            alert("위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.");
            return defaultLocation;
          }
        } catch (permError) {
          console.warn("⚠️ Cannot check permission status:", permError);
        }
      }

      // 위치 정보 요청
      console.log("📍 Requesting current position...");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.error("⏰ Geolocation timeout after 15 seconds");
          reject(new Error("Geolocation timeout"));
        }, 15000); // 15초로 늘림

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log("✅ Geolocation success!");
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error("❌ Geolocation error:", error);

            let errorMsg = '';
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = "위치 정보를 사용할 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.";
                break;
              case error.TIMEOUT:
                errorMsg = "위치 정보 요청이 시간 초과되었습니다. 다시 시도해주세요.";
                break;
              default:
                errorMsg = "알 수 없는 오류가 발생했습니다.";
                break;
            }

            alert(errorMsg);
            reject(error);
          },
          {
            enableHighAccuracy: true, // 정확도 우선
            timeout: 15000, // 15초 timeout
            maximumAge: 60000 // 1분간 캐시된 위치 허용
          }
        );
      });

      console.log("📍 Location obtained:", {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

    } catch (error) {
      console.error("💥 Geolocation failed:", error);
      console.log("📍 Using default location (Seoul)");
      return defaultLocation;
    }
  }

  // 날씨 데이터를 flags로 변환하는 함수
  function generateWeatherFlags(raw: ProcessedWeather | null | undefined): string[] {
    const flags: string[] = [];

    if (!raw) return flags;

    if (typeof raw.T1H === "number") {
      if (raw.T1H >= 28) flags.push("hot");
      if (raw.T1H <= 5) flags.push("cold");
    }

    if (raw.PTY) {
      if (raw.PTY === 1 || raw.PTY === 4) flags.push("rain");
      if (raw.PTY === 2 || raw.PTY === 3) flags.push("snow");
    }

    if (raw.SKY) {
      if (raw.SKY >= 3) flags.push("cloudy");
    }

    if (typeof raw.REH === "number" && raw.REH >= 80) {
      flags.push("humid");
    }

    if (typeof raw.WSD === "number" && raw.WSD >= 4) {
      flags.push("windy");
    }

    return flags;
  }

  const temperatureText = typeof weather?.T1H === "number" ? `${Math.round(weather.T1H)}°C` : "불러오는 중";
  const humidityText = typeof weather?.REH === "number" ? `${Math.round(weather.REH)}%` : "불러오는 중";
  const skyText = (() => {
    if (!weather) return "불러오는 중";
    const { PTY, SKY } = weather;
    if (PTY === 1 || PTY === 4) return "비";
    if (PTY === 2 || PTY === 3 || PTY === 5 || PTY === 6 || PTY === 7) return "눈";
    if (typeof SKY === "number") {
      if (SKY >= 4) return "흐림";
      if (SKY >= 3) return "구름많음";
    }
    return "맑음";
  })();
  const precipitationText = (() => {
    if (!weather) return "불러오는 중";
    const amount = Math.max(weather.RN1 ?? 0, weather.PCP ?? 0);
    if (amount <= 0) return "0mm";
    const rounded = Math.round(amount * 10) / 10;
    return `${rounded}mm`;
  })();
  const weatherTimeLabel = currentTimeDisplay ? `${currentTimeDisplay} (KST)` : null;

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
          <div className="text-center">
            <span className="text-base font-bold truncate drop-shadow-sm block" style={{ color: 'var(--app-fg)' }}>
              {locationAddress || (locationStatus === "success" ? "현재 위치" : "서울시청")}
            </span>
            {locationStatus === "fallback" && (
              <span className="text-xs opacity-75 drop-shadow-sm" style={{ color: 'var(--app-accent)' }}>
                위치 권한 필요
              </span>
            )}
            {locationStatus === "loading" && (
              <span className="text-xs opacity-75 drop-shadow-sm" style={{ color: 'var(--app-accent)' }}>
                위치 확인 중...
              </span>
            )}
          </div>
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
          aria-label="지금 뭐 먹지?로 이동"
        >
          <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-center">
            <span className="material-symbols-outlined text-8xl mb-2 block">restaurant_menu</span>
            <p className="text-xl font-extrabold tracking-tight">지금 뭐 먹지?</p>
          </div>
        </div>
      </main>

      {/* Bottom weather card */}
      <footer className="px-6 pb-8">
        <div className="mx-auto max-w-md rounded-xl shadow-lg backdrop-blur p-6 transition-colors duration-500" style={{ backgroundColor: 'var(--app-card)', color: 'var(--app-fg)' }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-base font-semibold opacity-90">현재 날씨</p>
              {weatherTimeLabel ? (
                <p className="text-xs opacity-70 mt-1">기준 {weatherTimeLabel}</p>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-base">
                <p>
                  <span className="font-bold">온도:</span> {temperatureText}
                </p>
                <p>
                  <span className="font-bold">습도:</span> {humidityText}
                </p>
                <p>
                  <span className="font-bold">하늘:</span> {skyText}
                </p>
                <p>
                  <span className="font-bold">강수량:</span> {precipitationText}
                </p>
              </div>
            </div>
            <WeatherBadge processed={weather ?? undefined} className="min-w-[5rem]" />
          </div>
        </div>
      </footer>
    </div>
  );
}
