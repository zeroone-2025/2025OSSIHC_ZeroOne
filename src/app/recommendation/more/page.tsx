"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MenuList, { type MenuItem } from "@/components/MenuList";
import { resolveMenuImage } from "@/lib/resolveImage";
import { useWeatherTheme } from "@/theme/WeatherThemeContext";

type ApiMenu = {
  id?: string;
  name?: string;
  name_ko?: string;
  name_en?: string;
  score?: number;
  picture?: string;
  imageUrl?: string;
};

const PLACEHOLDER_IMAGE = "/placeholder.png";

const FALLBACK_MENUS: MenuItem[] = [
  { name: "떡볶이", score: 68, imageUrl: PLACEHOLDER_IMAGE },
  { name: "치킨", score: 65, imageUrl: PLACEHOLDER_IMAGE },
  { name: "피자", score: 62, imageUrl: PLACEHOLDER_IMAGE },
  { name: "햄버거", score: 58, imageUrl: PLACEHOLDER_IMAGE },
  { name: "김밥", score: 55, imageUrl: PLACEHOLDER_IMAGE },
  { name: "제육볶음", score: 52, imageUrl: PLACEHOLDER_IMAGE },
  { name: "닭갈비", score: 48, imageUrl: PLACEHOLDER_IMAGE },
];

export default function MoreRecommendationPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getScoreLevel = (score: number) => {
    if (score >= 85) return { text: '매우추천', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { text: '추천', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 55) return { text: '보통', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { text: '별로', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: '비추천', color: 'text-red-600', bg: 'bg-red-100' };
  };

  useEffect(() => {
    // 추천 페이지에서 저장된 전체 메뉴 목록을 가져오기
    const savedMenus = sessionStorage.getItem('allRecommendedMenus');
    if (savedMenus) {
      try {
        const allMenus: MenuItem[] = JSON.parse(savedMenus);
        // 4등부터 10등까지 표시
        setMenus(allMenus.slice(3, 10));
      } catch (error) {
        console.error('Failed to parse saved menus:', error);
        setMenus(FALLBACK_MENUS);
      }
    } else {
      // 저장된 데이터가 없으면 fallback 메뉴 사용
      setMenus(FALLBACK_MENUS);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
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
            onClick={() => router.push("/recommendation?skipLoading=true")}
            className="h-12 w-12 grid place-items-center rounded-full shadow-lg transition-colors duration-500"
            style={{ backgroundColor: "var(--app-accent)", opacity: 0.8 }}
            aria-label="추천 메뉴로 돌아가기"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm text-white">arrow_back</span>
          </button>
          <span
            className="text-base font-bold truncate drop-shadow-sm"
            style={{ color: "var(--app-fg)" }}
          >
            추가 추천 메뉴
          </span>
          <div className="w-12" aria-hidden />
        </div>
      </header>

      <main className="px-6 pb-28 pt-6 mx-auto max-w-md flex-1">
        <div className="space-y-4">
          {menus.length > 0 ? (
            menus.map((menu, index) => {
              const scoreLevel = getScoreLevel(menu.score);
              return (
                <div key={menu.name} className="flex items-center gap-6 p-6 rounded-xl shadow-lg ring-1 transition-all duration-500 hover:scale-[1.01] w-full"
                  style={{
                    backgroundColor: 'var(--app-card)',
                    color: 'var(--app-fg)',
                    borderColor: 'var(--app-accent)'
                  }}
                >
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="text-xl font-bold text-gray-500">#{index + 4}</div>
                  </div>
                  <img
                    src={menu.imageUrl}
                    alt={menu.name}
                    className="w-24 h-24 object-cover rounded-xl ring-2 shadow-md transition-colors duration-500 flex-shrink-0"
                    style={{ borderColor: 'var(--app-accent)' }}
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold truncate mb-3" style={{ color: 'var(--app-fg)' }}>{menu.name}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${scoreLevel.color} ${scoreLevel.bg}`}
                    >
                      {scoreLevel.text}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p
              className="py-16 text-center opacity-80 text-lg font-semibold"
              style={{ color: "var(--app-fg)" }}
            >
              추가 추천 결과가 없습니다.
            </p>
          )}
        </div>
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