"use client";
import { useCallback, useEffect, useState } from "react";
import HeaderBar from "@/components/HeaderBar";
import BigActionButton from "@/components/BigActionButton";
import WeatherBar, { type WeatherSnapshot } from "@/components/WeatherBar";
import { getCoordsWithFallback } from "@/lib/ui/geo";
import { flagsToSnapshot, FALLBACK_SNAPSHOT } from "@/lib/ui/weather";

type RecoRes = { menus: string[]; flags?: string[] };

export default function Home() {
  const [menus, setMenus] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState(FALLBACK_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState<string | undefined>();

  const runReco = useCallback(async () => {
    try {
      setLoading(true);
      const { lat, lng } = await getCoordsWithFallback();
      const res = await fetch("/api/reco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      if (!res.ok) throw new Error("추천 실패");
      const json: RecoRes = await res.json();
      setMenus((json.menus ?? ["비빔밥", "국밥", "라멘"]).slice(0, 3));
      setSnapshot(flagsToSnapshot(json.flags));
      setWarn(undefined);
    } catch {
      setMenus(["비빔밥", "국밥", "라멘"]);
      setSnapshot(FALLBACK_SNAPSHOT);
      setWarn("네트워크/권한 문제로 임시 추천을 표시합니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runReco();
  }, [runReco]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-[100dvh] relative flex w-full flex-col justify-between">
      <HeaderBar locationLabel="군산시 명산동" onRefresh={runReco} />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <BigActionButton onClick={runReco} disabled={loading} />
        {warn ? <p className="mt-3 text-xs text-red-600">{warn}</p> : null}
        <ul className="mt-6 w-full max-w-xs space-y-2 text-center">
          {menus.map((m) => (
            <li key={m} className="rounded-lg bg-white/80 dark:bg-white/10 p-3 font-semibold text-black dark:text-white">
              {m}
            </li>
          ))}
        </ul>
      </main>
      <WeatherBar data={snapshot} />
    </div>
  );
}
