"use client";
import { RefreshCw, User } from "lucide-react";

export default function HeaderBar({
  locationLabel = "군산시 명산동",
  onRefresh,
}: {
  locationLabel?: string;
  onRefresh?: () => void;
}) {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4">
      <div className="flex items-center justify-between text-black dark:text-white">
        <button
          aria-label="새로고침"
          onClick={onRefresh}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 dark:bg-white/10"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">{locationLabel}</h1>
        </div>
        <a
          href="/profile"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 dark:bg-white/10"
          aria-label="프로필"
        >
          <User className="h-6 w-6" />
        </a>
      </div>
    </header>
  );
}