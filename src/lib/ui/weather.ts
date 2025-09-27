import type { WeatherSnapshot } from "@/components/WeatherBar";

export const FALLBACK_SNAPSHOT: WeatherSnapshot = {
  tempC: 25,
  rh: 70,
  sky: 3,
  pty: 1,
  pcpText: "비 5mm/h",
};

export function flagsToSnapshot(flags?: string[]): WeatherSnapshot {
  const set = new Set((flags ?? []).map((f) => f.toLowerCase()));
  const snap: WeatherSnapshot = { ...FALLBACK_SNAPSHOT, pty: 0, pcpText: undefined };
  if (set.has("cold")) snap.tempC = 8;
  if (set.has("hot")) snap.tempC = 30;
  if (set.has("humid")) snap.rh = 85;
  if (set.has("rain")) {
    snap.pty = 1;
    snap.pcpText = "비 5mm/h";
  }
  return snap;
}