"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Home as HomeIcon } from "lucide-react";
import MenuList, { type MenuListItem } from "@/components/MenuList";

type RecoResponse = {
  menus: MenuListItem[];
  weights?: Record<string, number>;
  raw?: unknown;
};

const FALLBACK_MENUS: MenuListItem[] = [
  { name: "국밥", score: 0.82 },
  { name: "냉면", score: 0.78 },
  { name: "비빔밥", score: 0.74 },
];

export default function RecommendationPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyFallback = (message: string) => {
      if (cancelled) return;
      setMenus(FALLBACK_MENUS);
      setWeights(null);
      setError(message);
      setLoading(false);
    };

    const fetchRecommendation = async (lat: number, lng: number) => {
      try {
        const response = await fetch("/api/reco", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        if (!response.ok) {
          throw new Error(`API ${response.status}`);
        }
        const data: RecoResponse = await response.json();
        const sortedMenus = Array.isArray(data.menus)
          ? [...data.menus].sort((a, b) => b.score - a.score)
          : [];
        const topMenus = sortedMenus.slice(0, Math.max(3, Math.min(sortedMenus.length, 5)));
        if (!topMenus.length) {
          throw new Error("NO_RESULTS");
        }
        if (cancelled) return;
        setMenus(topMenus);
        setWeights(data.weights ?? null);
        setError(null);
      } catch (err) {
        console.error("Recommendation fetch failed", err);
        applyFallback("임시 추천 메뉴를 보여드립니다");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const requestPosition = () => {
      if (!("geolocation" in navigator)) {
        applyFallback("위치 정보를 사용할 수 없어 임시 추천을 제공합니다.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          const { latitude, longitude } = position.coords;
          fetchRecommendation(latitude, longitude).catch(() => {
            applyFallback("임시 추천 메뉴를 보여드립니다");
          });
        },
        () => {
          applyFallback("위치 권한이 필요해 임시 추천을 제공합니다.");
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    };

    setLoading(true);
    setError(null);
    requestPosition();

    return () => {
      cancelled = true;
    };
  }, []);

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-24 animate-pulse rounded-2xl bg-white/50 shadow dark:bg-white/10"
        />
      )),
    []
  );

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-black dark:text-white">
      <div className="flex min-h-[100dvh] flex-col">
        <header className="sticky top-0 z-20 border-b border-white/20 bg-white/70 px-4 py-5 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/50">
          <h1 className="text-xl font-bold text-primary dark:text-white">추천 메뉴 리스트</h1>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6">
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-400/60 bg-yellow-100/70 p-4 text-sm text-yellow-800 dark:border-yellow-500/50 dark:bg-yellow-500/20 dark:text-yellow-100">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">{skeletonItems}</div>
          ) : (
            <MenuList menus={menus} />
          )}

          {weights ? (
            <section className="mt-8 rounded-2xl border border-white/30 bg-white/60 p-4 shadow dark:border-white/10 dark:bg-black/30">
              <h2 className="text-sm font-semibold text-primary dark:text-white">계산된 날씨 가중치</h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-black/70 dark:text-white/70">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-black/30">
                    <dt className="font-medium text-black dark:text-white">{key}</dt>
                    <dd>{value.toFixed(2)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </main>
        <footer className="sticky bottom-0 z-20 border-t border-white/30 bg-white/80 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-black/50">
          <button
            type="button"
            aria-label="홈으로 돌아가기"
            onClick={() => router.push("/")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary/20 px-4 py-3 text-base font-semibold text-primary transition hover:opacity-90 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            <HomeIcon className="h-5 w-5" />
            홈으로 돌아가기
          </button>
        </footer>
      </div>
    </div>
  );
}
