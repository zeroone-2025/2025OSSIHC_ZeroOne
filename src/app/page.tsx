"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative flex h-screen w-full flex-col justify-between bg-background-light font-display dark:bg-background-dark">
      {/* Top bar */}
      <header className="absolute left-0 right-0 top-0 z-10 p-4">
        <div className="flex items-center justify-between text-black dark:text-white">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 dark:bg-white/10"
            onClick={() => location.reload()}
            aria-label="새로고침"
          >
            <span className="material-symbols-outlined text-2xl">refresh</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">현재 위치</h1>
          </div>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 dark:bg-white/10"
            aria-label="프로필"
          >
            <span className="material-symbols-outlined text-2xl">person</span>
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
          className="gradient-background flex aspect-square w-64 cursor-pointer select-none items-center justify-center rounded-full shadow-2xl"
          aria-label="점심 메뉴 추천으로 이동"
        >
          <div className="text-center text-white">
            <span className="material-symbols-outlined text-6xl">restaurant_menu</span>
            <p className="mt-2 text-lg font-bold">점심 메뉴 추천</p>
          </div>
        </div>
      </main>

      {/* Bottom weather card (placeholder) */}
      <footer className="p-4 pb-8">
        <div className="rounded-lg bg-white/50 p-4 backdrop-blur-sm dark:bg-black/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-black/60 dark:text-white/60">현재 날씨</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-black dark:text-white">
                <p>
                  <span className="font-semibold">온도:</span> 25°C
                </p>
                <p>
                  <span className="font-semibold">습도:</span> 60%
                </p>
                <p>
                  <span className="font-semibold">하늘:</span> 맑음
                </p>
                <p>
                  <span className="font-semibold">강수량:</span> 0mm
                </p>
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20">
              <span className="material-symbols-outlined text-4xl text-primary">thermostat</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
