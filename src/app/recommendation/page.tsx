"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSequence from "@/components/LoadingSequence";
import MenuList, { type MenuItem } from "@/components/MenuList";

type RecoApiRes = {
  menus?: { name: string; score: number; imageUrl?: string }[];
  weights?: Record<string, number>;
  raw?: unknown;
  error?: string;
};

const FALLBACK_MENUS: MenuItem[] = [
  { name: "국밥", score: 0.82 },
  { name: "비빔밥", score: 0.76 },
  { name: "라멘", score: 0.72 },
];

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/64";

async function loadImageIndex() {
  try {
    const res = await fetch("/kfood-index.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Record<string, string>;
  } catch (error) {
    console.warn("[kfood-index] load failed", error);
    return {} as Record<string, string>;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPosition(options?: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("위치 정보를 사용할 수 없습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export default function RecommendationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [raw, setRaw] = useState<unknown>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  const loadingMessages = useMemo(
    () => [
      "지금은 날씨를 확인하고 있습니다...",
      "지금은 주변 환경을 분석 중입니다...",
      "메뉴 데이터셋을 불러오는 중입니다...",
      "복잡한 연산을 통해 메뉴를 계산하는 중...",
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const minDelayPromise = delay(3000);
      const indexPromise = loadImageIndex();
      let fetchedMenus: MenuItem[] | null = null;
      let fetchedWeights: Record<string, number> | null = null;
      let fetchedRaw: unknown = null;
      let errorMessage = "";

      try {
        const position = await getPosition({ enableHighAccuracy: true, timeout: 8000 });
        const response = await fetch("/api/reco", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          cache: "no-store",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `추천 API 실패 (${response.status})`);
        }

        const data: RecoApiRes = await response.json();
        const sortedMenus = Array.isArray(data.menus)
          ? [...data.menus]
              .map((menu) => ({ ...menu, score: Number.isFinite(menu.score) ? menu.score : 0 }))
              .sort((a, b) => b.score - a.score)
          : [];
        const limitedMenus = sortedMenus.slice(0, 10);

        if (!limitedMenus.length) {
          throw new Error("추천 결과가 비어 있습니다.");
        }

        fetchedMenus = limitedMenus;
        fetchedWeights = data.weights ?? {};
        fetchedRaw = data.raw ?? null;
      } catch (error: any) {
        errorMessage = error?.message ?? "추천 데이터를 불러오는 중 문제가 발생했습니다.";
        fetchedMenus = FALLBACK_MENUS;
        fetchedWeights = {};
        fetchedRaw = null;
      }

      const imageIndex = await indexPromise;
      await minDelayPromise;

      if (cancelled) return;

      const finalMenus = (fetchedMenus ?? FALLBACK_MENUS)
        .slice(0, 10)
        .map((menu) => ({
          ...menu,
          imageUrl: imageIndex?.[menu.name] ? decodeURI(imageIndex[menu.name]) : PLACEHOLDER_IMAGE,
        }));

      setMenus(finalMenus);
      setWeights(fetchedWeights ?? {});
      setRaw(fetchedRaw);
      setErrMsg(errorMessage);
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-50 px-6 py-4 text-white dark:text-white bg-black/30 dark:bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 w-12 grid place-items-center rounded-full bg-white/20 shadow-lg"
            aria-label="뒤로가기"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm">arrow_back</span>
          </button>
          <span className="text-base font-bold truncate drop-shadow-sm">추천 메뉴 리스트</span>
          <div className="w-12" aria-hidden />
        </div>
        {errMsg ? (
          <p className="mt-3 text-center text-base text-red-300 font-semibold drop-shadow-sm">주의: {errMsg} (임시 추천 표시 중)</p>
        ) : null}
      </header>

      <main className="px-6 pb-28 pt-20 mx-auto max-w-md flex-1 overflow-y-auto">
        {phase === "loading" ? (
          <LoadingSequence messages={loadingMessages} totalMs={3000} stepMs={800} />
        ) : (
          <div className="space-y-8 pt-6">
            {menus.length > 0 ? (
              <MenuList menus={menus} />
            ) : (
              <p className="py-16 text-center text-gray-900 dark:text-gray-100 opacity-80 text-lg font-semibold">추천 결과가 없습니다.</p>
            )}

            <section className="rounded-xl bg-white/95 dark:bg-black/60 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/10 dark:ring-white/20 p-6">
              <h2 className="mb-4 text-base font-bold">요약</h2>
              <pre className="whitespace-pre-wrap text-sm opacity-85 leading-relaxed">
                {JSON.stringify(
                  {
                    weights,
                    raw,
                  },
                  null,
                  2
                )}
              </pre>
            </section>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-black/70 backdrop-blur border-t border-black/15 dark:border-white/15 shadow-lg">
        <div className="mx-auto max-w-md p-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full h-16 rounded-xl font-bold text-lg bg-primary text-white hover:opacity-90 active:opacity-80 flex items-center justify-center gap-3 shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-2xl">home</span>
            <span>홈으로 돌아가기</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
