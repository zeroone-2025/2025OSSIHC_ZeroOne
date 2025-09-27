"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 relative flex h-screen w-full flex-col justify-between font-display">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-6 py-4 text-white dark:text-white bg-black/30 dark:bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <button
            className="h-12 w-12 grid place-items-center rounded-full bg-white/20 shadow-lg"
            onClick={() => location.reload()}
            aria-label="새로고침"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm">refresh</span>
          </button>
          <span className="text-base font-bold truncate drop-shadow-sm">군산시 명산동</span>
          <button
            className="h-12 w-12 grid place-items-center rounded-full bg-white/20 shadow-lg"
            aria-label="프로필"
          >
            <span className="material-symbols-outlined text-2xl drop-shadow-sm">person</span>
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
          className="gradient-background rounded-full aspect-square w-72 shadow-2xl ring-2 ring-white/40 grid place-items-center cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
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
        <div className="mx-auto max-w-md rounded-xl bg-white/95 dark:bg-black/70 text-gray-900 dark:text-gray-100 shadow-lg backdrop-blur p-6">
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
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/30 shadow-sm">
              <span className="material-symbols-outlined text-5xl text-primary drop-shadow-sm">thermostat</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
