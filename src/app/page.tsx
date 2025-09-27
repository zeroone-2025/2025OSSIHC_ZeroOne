"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 relative flex h-screen w-full flex-col justify-between font-display">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-4 py-3 text-white dark:text-white bg-black/20 dark:bg-black/30 backdrop-blur-md">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <button
            className="h-10 w-10 grid place-items-center rounded-full bg-white/15"
            onClick={() => location.reload()}
            aria-label="새로고침"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
          <span className="text-sm font-semibold truncate">군산시 명산동</span>
          <button
            className="h-10 w-10 grid place-items-center rounded-full bg-white/15"
            aria-label="프로필"
          >
            <span className="material-symbols-outlined text-xl">person</span>
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
          className="gradient-background rounded-full aspect-square w-64 shadow-2xl ring-1 ring-white/30 grid place-items-center cursor-pointer select-none"
          aria-label="점심 메뉴 추천으로 이동"
        >
          <div className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            <span className="material-symbols-outlined text-6xl">restaurant_menu</span>
            <p className="mt-2 text-lg font-extrabold tracking-tight">점심 메뉴 추천</p>
          </div>
        </div>
      </main>

      {/* Bottom weather card (placeholder) */}
      <footer className="px-4 pb-8">
        <div className="mx-auto max-w-md rounded-xl bg-white/85 dark:bg-black/50 text-gray-900 dark:text-gray-100 shadow-md backdrop-blur p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm opacity-80">현재 날씨</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
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
