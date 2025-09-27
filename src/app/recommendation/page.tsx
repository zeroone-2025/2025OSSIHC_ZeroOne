"use client";

import { useEffect, useMemo, useState } from "react";
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

      await minDelayPromise;

      if (cancelled) return;

      setMenus((fetchedMenus ?? FALLBACK_MENUS).slice(0, 10));
      setWeights(fetchedWeights ?? {});
      setRaw(fetchedRaw);
      setErrMsg(errorMessage);
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background-light text-black dark:bg-background-dark dark:text-white">
        <header className="sticky top-0 z-10 p-4">
          <h1 className="text-center text-xl font-bold">추천 준비 중</h1>
        </header>
        <LoadingSequence messages={loadingMessages} totalMs={3000} stepMs={800} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col bg-background-light text-black dark:bg-background-dark dark:text-white">
      <header className="sticky top-0 z-10 p-4">
        <h1 className="text-center text-xl font-bold">추천 메뉴 리스트</h1>
        {errMsg ? (
          <p className="mt-2 text-center text-sm text-red-500">주의: {errMsg} (임시 추천 표시 중)</p>
        ) : null}
      </header>

      <main className="flex-grow space-y-6 overflow-y-auto px-4 pb-4">
        {menus.length > 0 ? <MenuList menus={menus} /> : <p className="text-center text-gray-500">추천 결과가 없습니다.</p>}

        <section className="mt-4 rounded-xl bg-white/60 p-4 dark:bg-black/20">
          <h2 className="mb-2 text-sm font-semibold">요약</h2>
          <pre className="whitespace-pre-wrap text-xs">
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
      </main>

      <div className="sticky bottom-0 px-4 pb-4">
        <a
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 px-4 font-bold text-white"
        >
          <span className="material-symbols-outlined">home</span>
          <span>홈으로 돌아가기</span>
        </a>
      </div>
    </div>
  );
}
