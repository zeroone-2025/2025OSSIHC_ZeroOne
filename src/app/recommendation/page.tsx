// TODO: Replace mock weather with real API later
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSteps from "@/components/LoadingSteps";
import MenuList, { type MenuItem } from "@/components/MenuList";
import { resolveMenuImage } from "@/lib/resolveImage";
<<<<<<< Updated upstream
import { useWeatherTheme } from "@/theme/WeatherThemeContext";

type ApiMenu = Partial<MenuItem> & {
  id?: string;
  name_ko?: string;
  name_en?: string;
  picture?: string;
=======
import { getMockWeather, pickKSTHour, type HourRow } from "@/lib/mockWeather";
import { useWeatherTheme } from "@/theme/WeatherThemeContext";

type ApiMenu = {
  id?: string;
  name?: string;
  name_ko?: string;
  name_en?: string;
  score?: number;
  picture?: string;
  imageUrl?: string;
>>>>>>> Stashed changes
};

type RecoApiRes = {
  menus?: ApiMenu[];
  weights?: Record<string, number>;
  raw?: unknown;
  flags?: string[];
  error?: string;
};

const PLACEHOLDER_IMAGE = "/placeholder.png";

const FALLBACK_MENUS: MenuItem[] = [
<<<<<<< Updated upstream
  { name: "국밥", score: 0.82, imageUrl: PLACEHOLDER_IMAGE },
  { name: "비빔밥", score: 0.76, imageUrl: PLACEHOLDER_IMAGE },
  { name: "라멘", score: 0.72, imageUrl: PLACEHOLDER_IMAGE },
=======
  { name: "국밥", score: 82, imageUrl: PLACEHOLDER_IMAGE },
  { name: "비빔밥", score: 76, imageUrl: PLACEHOLDER_IMAGE },
  { name: "라멘", score: 72, imageUrl: PLACEHOLDER_IMAGE },
>>>>>>> Stashed changes
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toWeatherRaw(row: HourRow | null) {
  if (!row) return undefined;
  return {
    T1H: row.temp_c,
    REH: row.humidity_pct,
    WSD: row.wind_ms,
    SKY: row.cloud_10 >= 8 ? 4 : row.cloud_10 >= 3 ? 3 : 1,
    PTY: row.precip_mm > 0 ? 1 : 0,
    PCP: row.precip_mm,
    SNO: 0,
    RN1: row.precip_mm,
  };
}

// 개선된 위치 정보 가져오기 함수
async function getLocationWithFallback(): Promise<{ latitude: number; longitude: number }> {
  // 기본 위치 (서울 시청)
  const defaultLocation = { latitude: 37.5665, longitude: 126.9780 };

  // 브라우저 지원 여부 확인
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    console.warn("Geolocation not supported, using default location");
    return defaultLocation;
  }

  try {
    console.log("Requesting geolocation permission...");

    // 먼저 권한 상태 확인 (지원하는 브라우저에서만)
    if ("permissions" in navigator) {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      console.log("Geolocation permission status:", permission.state);

      if (permission.state === "denied") {
        console.warn("Geolocation permission denied, using default location");
        return defaultLocation;
      }
    }

    // 위치 정보 요청
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Geolocation timeout"));
      }, 10000); // 10초로 늘림

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          resolve(pos);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        {
          enableHighAccuracy: false, // 더 빠른 응답을 위해 false로 변경
          timeout: 10000,
          maximumAge: 300000, // 5분간 캐시된 위치 허용
        },
      );
    });

    console.log("Geolocation success:", position.coords);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.warn("Geolocation failed:", error);
    console.log("Using default location (Seoul)");
    return defaultLocation;
  }
}

export default function RecommendationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setThemeFromFlags } = useWeatherTheme();
  const skipLoading = searchParams.get('skipLoading') === 'true';
  const [phase, setPhase] = useState<"loading" | "ready">(skipLoading ? "ready" : "loading");
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [errMsg, setErrMsg] = useState<string>("");


  useEffect(() => {
    let cancelled = false;

    // skipLoading이 true이면 세션 스토리지에서 메뉴 로드
    if (skipLoading) {
      const savedMenus = sessionStorage.getItem('allRecommendedMenus');
      if (savedMenus) {
        try {
          const parsedMenus: MenuItem[] = JSON.parse(savedMenus);
          setMenus(parsedMenus);
          setPhase("ready");
          return;
        } catch (error) {
          console.error('Failed to parse saved menus:', error);
        }
      }
    }

    (async () => {
<<<<<<< Updated upstream
      const minDelayPromise = delay(3000);
=======
      const minDelayPromise = delay(5000);
      const weatherPromise = getMockWeather()
        .then((rows) => pickKSTHour(rows, new Date()))
        .catch((error) => {
          console.warn("[mock-weather] load failed", error);
          return null;
        });

>>>>>>> Stashed changes
      let fetchedMenus: ApiMenu[] | null = null;
      let errorMessage = "";
      let themeFlags: string[] = [];

      try {
        const position = await getLocationWithFallback();
        console.log("Using location for recommendation:", position);

        const response = await fetch("/api/reco", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: position.latitude, lng: position.longitude }),
          cache: "no-store",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `추천 API 실패 (${response.status})`);
        }

        const data: RecoApiRes = await response.json();
        const sortedMenus = Array.isArray(data.menus)
          ? [...data.menus]
<<<<<<< Updated upstream
              .map((menu) => ({
                ...menu,
                score: Number.isFinite(menu.score) ? Number(menu.score) : 0,
              }))
=======
              .map((menu) => ({ ...menu, score: Number.isFinite(menu.score) ? Number(menu.score) : 0 }))
>>>>>>> Stashed changes
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          : [];
        const limitedMenus = sortedMenus.slice(0, 10);

        if (!limitedMenus.length) {
          throw new Error("추천 결과가 비어 있습니다.");
        }

        fetchedMenus = limitedMenus;
        if (Array.isArray(data.flags) && data.flags.length > 0) {
          themeFlags = data.flags;
        } else if (data.raw) {
          themeFlags = generateWeatherFlags(data.raw);
        }
      } catch (error: any) {
        console.warn("[recommendation] failed", error);
        errorMessage = error?.message ?? "추천 데이터를 불러오는 중 문제가 발생했습니다.";
      }

<<<<<<< Updated upstream
      await minDelayPromise;
=======
      const weatherRow = await weatherPromise;
      if (!themeFlags.length) {
        themeFlags = generateWeatherFlags(toWeatherRaw(weatherRow));
      }
      setThemeFromFlags(themeFlags);
>>>>>>> Stashed changes

      await minDelayPromise;
      if (cancelled) return;

<<<<<<< Updated upstream
      const finalMenus: MenuItem[] = (fetchedMenus ?? FALLBACK_MENUS)
        .slice(0, 10)
        .map((menu) => {
          const source = menu as ApiMenu;
          const nameCandidate =
            (typeof source.name_ko === "string" && source.name_ko.trim()) ||
            (typeof source.name === "string" && source.name.trim()) ||
            (typeof source.name_en === "string" && source.name_en.trim()) ||
            (typeof source.id === "string" && source.id.trim()) ||
            "메뉴";
          const scoreValue =
            typeof source.score === "number" && Number.isFinite(source.score)
              ? source.score
              : 0;
          const imageSource =
            typeof source.picture === "string" && source.picture
              ? source.picture
              : source.imageUrl;
          return {
            name: nameCandidate,
            score: scoreValue,
            imageUrl: resolveMenuImage(imageSource, nameCandidate),
          };
        });
=======
      const usingApiMenus = Array.isArray(fetchedMenus) && fetchedMenus.length > 0;
      const sourceMenus = (usingApiMenus ? fetchedMenus : FALLBACK_MENUS) as (ApiMenu | MenuItem)[];

      const finalMenus: MenuItem[] = sourceMenus.slice(0, 10).map((menu) => {
        if (!usingApiMenus) {
          return menu as MenuItem;
        }

        const source = menu as ApiMenu;
        const nameCandidate =
          (typeof source.name_ko === "string" && source.name_ko.trim()) ||
          (typeof source.name === "string" && source.name.trim()) ||
          (typeof source.name_en === "string" && source.name_en.trim()) ||
          (typeof source.id === "string" && source.id.trim()) ||
          "메뉴";
        const rawScore =
          typeof source.score === "number" && Number.isFinite(source.score)
            ? source.score
            : 0;
        const scoreValue = Math.min(100, Math.max(0, rawScore));
        const imageSource =
          typeof source.picture === "string" && source.picture
            ? source.picture
            : source.imageUrl;

        return {
          name: nameCandidate,
          score: scoreValue,
          imageUrl: resolveMenuImage(imageSource, nameCandidate),
        };
      });
>>>>>>> Stashed changes

      setMenus(finalMenus);
      setErrMsg(errorMessage);

      // 전체 메뉴 목록을 세션 스토리지에 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('allRecommendedMenus', JSON.stringify(finalMenus));
      }

      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [setThemeFromFlags, skipLoading]);

  // 날씨 데이터를 flags로 변환하는 함수
  function generateWeatherFlags(raw: any): string[] {
    const flags: string[] = [];

    if (!raw) return flags;

    // 온도 기반
    if (typeof raw.T1H === "number") {
      if (raw.T1H >= 28) flags.push("hot");
      if (raw.T1H <= 5) flags.push("cold");
    }

    // 강수 형태
    if (raw.PTY) {
      if (raw.PTY === 1 || raw.PTY === 4) flags.push("rain");
      if (raw.PTY === 2 || raw.PTY === 3) flags.push("snow");
    }

    // 하늘 상태
    if (raw.SKY) {
      if (raw.SKY >= 3) flags.push("cloudy");
    }

    // 습도
    if (typeof raw.REH === "number" && raw.REH >= 80) {
      flags.push("humid");
    }

    // 풍속
    if (typeof raw.WSD === "number" && raw.WSD >= 4) {
      flags.push("windy");
    }

    return flags;
  }

  return (
    <div
      className="min-h-screen flex flex-col max-w-md mx-auto transition-colors duration-500"
      style={{ color: "var(--app-fg)" }}
    >
      <header
        className="sticky top-0 z-50 px-6 py-4 backdrop-blur-md transition-colors duration-500"
        style={{ background: "rgba(0,0,0,0.3)", color: "var(--app-fg)" }}
      >
        <div className="mx-auto max-w-md flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 w-12 grid place-items-center rounded-full shadow-lg transition-colors duration-500"
            style={{ backgroundColor: "var(--app-accent)", opacity: 0.8 }}
            aria-label="뒤로가기"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm text-white">arrow_back</span>
          </button>
          <span
            className="text-base font-bold truncate drop-shadow-sm"
            style={{ color: "var(--app-fg)" }}
          >
            추천 메뉴 리스트
          </span>
          <div className="w-12" aria-hidden />
        </div>
        {errMsg ? (
          <p
            className="mt-3 text-center text-base font-semibold drop-shadow-sm"
            style={{ color: "var(--app-accent)" }}
          >
            주의: {errMsg} (임시 추천 표시 중)
          </p>
        ) : null}
      </header>

      <main className="px-6 pb-28 pt-6 mx-auto max-w-md flex-1 flex flex-col">
        {phase === "loading" ? (
          <LoadingSteps onDone={() => setPhase("ready")} stepDuration={700} />
        ) : (
          <div className="flex-1 flex flex-col pt-6">
            {menus.length > 0 ? (
              <>
                <MenuList menus={menus.slice(0, 3)} />
                {menus.length > 3 && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => router.push("/recommendation/more")}
                      className="px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-md"
                      style={{
                        backgroundColor: "var(--app-accent)",
                        color: "white",
                        opacity: 0.9
                      }}
                    >
                      더 많은 추천 보기 ({menus.length - 3}개)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p
                className="py-16 text-center opacity-80 text-lg font-semibold"
                style={{ color: "var(--app-fg)" }}
              >
                추천 결과가 없습니다.
              </p>
            )}
          </div>
        )}
      </main>

      <footer
        className="fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t shadow-lg transition-colors duration-500"
        style={{ backgroundColor: "var(--app-card)", borderColor: "var(--app-accent)" }}
      >
        <div className="mx-auto max-w-md p-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full h-16 rounded-xl font-bold text-lg text-white hover:opacity-90 active:opacity-80 flex items-center justify-center gap-3 shadow-md transition-all"
            style={{ backgroundColor: "var(--app-accent)" }}
          >
            <span className="material-symbols-outlined text-2xl">home</span>
            <span>홈으로 돌아가기</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
