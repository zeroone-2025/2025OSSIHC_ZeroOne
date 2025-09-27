// src/components/WeatherBadge.tsx
"use client";

import React from "react";
import { pickMainWeatherIcon, pickSecondaryIcons, type ProcessedWeather } from "@/lib/ui/weatherIcon";

type Props = {
  processed?: ProcessedWeather; // usually from /api/weather/live raw.processed or from local JSON MVP
  className?: string;
};

/** Square badge with the main weather icon and optional micro-hints underneath. */
export default function WeatherBadge({ processed, className = "" }: Props) {
  const main = pickMainWeatherIcon(processed);
  const hints = pickSecondaryIcons(processed);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="flex h-20 w-20 items-center justify-center rounded-xl shadow-sm transition-colors duration-500"
        style={{ backgroundColor: "var(--app-accent)", opacity: 0.3 }}
        aria-label="weather-badge"
      >
        <span className="material-symbols-outlined text-5xl drop-shadow-sm" style={{ color: "var(--app-accent)" }}>
          {main}
        </span>
      </div>
      {hints.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-black/60 dark:text-white/70">
          {hints.slice(0, 3).map((ic) => (
            <span key={ic} className="material-symbols-outlined leading-none align-middle">
              {ic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
