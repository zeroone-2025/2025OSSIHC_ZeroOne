"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import HeaderBar from "@/components/HeaderBar";
import BigActionButton from "@/components/BigActionButton";
import WeatherBar from "@/components/WeatherBar";
import { FALLBACK_SNAPSHOT } from "@/lib/ui/weather";

export default function Home() {
  const router = useRouter();
  const snapshot = useMemo(() => FALLBACK_SNAPSHOT, []);

  const goToRecommendation = useCallback(() => {
    router.push("/recommendation");
  }, [router]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-[100dvh] relative flex w-full flex-col justify-between">
      <HeaderBar locationLabel="군산시 명산동" onRefresh={goToRecommendation} />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <BigActionButton onClick={goToRecommendation} />
      </main>
      <WeatherBar data={snapshot} />
    </div>
  );
}
