"use client";
import { Thermometer, Droplets, Cloud, CloudRain } from "lucide-react";

export type SkyCode = 1 | 3 | 4;
export type WeatherSnapshot = {
  tempC: number; // 25
  rh: number; // %
  sky: SkyCode; // 1 맑음, 3 구름많음, 4 흐림
  pty: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 강수형태
  pcpText?: string; // "비 5mm/h"
};

export default function WeatherBar({ data }: { data: WeatherSnapshot }) {
  const { tempC, rh, sky, pty, pcpText } = data;
  const rainy = [1, 4, 5].includes(pty);
  const skyText = rainy
    ? "비"
    : sky === 1
    ? "맑음"
    : sky === 3
    ? "구름많음"
    : "흐림";

  return (
    <footer className="p-4 pb-8">
      <div className="rounded-lg bg-white/50 dark:bg-black/20 p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-black/60 dark:text-white/60">현재 날씨</p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-black dark:text-white">
              <p>
                <span className="font-semibold">온도:</span> {Math.round(tempC)}°C
              </p>
              <p>
                <span className="font-semibold">습도:</span> {Math.round(rh)}%
              </p>
              <p>
                <span className="font-semibold">하늘:</span> {skyText}
              </p>
              <p>
                <span className="font-semibold">강수량:</span>{" "}
                {rainy ? pcpText ?? "비" : "0mm"}
              </p>
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20">
            {rainy ? (
              <CloudRain className="h-8 w-8 text-primary" />
            ) : (
              <Cloud className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}