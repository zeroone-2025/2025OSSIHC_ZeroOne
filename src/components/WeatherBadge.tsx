// src/components/WeatherBadge.tsx
"use client";

import React from "react";
import { getMainWeatherEmoji, getWeatherEmoji, pickSecondaryIcons, type ProcessedWeather } from "@/lib/ui/weatherIcon";

type Props = {
  processed?: ProcessedWeather; // usually from /api/weather/live raw.processed or from local JSON MVP
  className?: string;
};

/** Square badge with the main weather emoji and optional micro-hints underneath. */
export default function WeatherBadge({ processed, className = "" }: Props) {
  const mainEmoji = getMainWeatherEmoji(processed);
  const hints = pickSecondaryIcons(processed);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="flex h-20 w-20 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "2px solid var(--app-accent)"
        }}
        aria-label="weather-badge"
      >
        <div className="text-4xl">
          {mainEmoji}
        </div>
      </div>
      {hints.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          {hints.slice(0, 3).map((ic) => (
            <div key={ic} className="text-base">
              {getWeatherEmoji(ic)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
