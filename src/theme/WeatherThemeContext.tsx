"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type WeatherTheme = "sunny" | "rain" | "snow" | "cloudy" | "hot" | "cold" | "humid" | "windy";

interface WeatherThemeContextType {
  theme: WeatherTheme;
  setTheme: (theme: WeatherTheme) => void;
  setThemeFromFlags: (flags: string[]) => void;
}

const WeatherThemeContext = createContext<WeatherThemeContextType | null>(null);

export const useWeatherTheme = () => {
  const context = useContext(WeatherThemeContext);
  if (!context) {
    throw new Error("useWeatherTheme must be used within WeatherThemeProvider");
  }
  return context;
};

// flags → theme 매핑 유틸 함수
// 우선순위: rain|snow > hot|cold > cloudy > humid > windy > sunny(default)
export function flagsToTheme(flags: string[]): WeatherTheme {
  if (!Array.isArray(flags)) return "sunny";

  const flagSet = new Set(flags.map(f => f.toLowerCase()));

  // 최고 우선순위: 강수/강설
  if (flagSet.has("snow")) return "snow";
  if (flagSet.has("rain") || flagSet.has("rainy")) return "rain";

  // 온도 기반
  if (flagSet.has("hot")) return "hot";
  if (flagSet.has("cold")) return "cold";

  // 하늘 상태
  if (flagSet.has("cloudy")) return "cloudy";

  // 기타 날씨 조건
  if (flagSet.has("humid")) return "humid";
  if (flagSet.has("windy")) return "windy";

  // 기본값
  return "sunny";
}

interface WeatherThemeProviderProps {
  children: ReactNode;
}

export function WeatherThemeProvider({ children }: WeatherThemeProviderProps) {
  const [theme, setTheme] = useState<WeatherTheme>("sunny");

  const setThemeFromFlags = (flags: string[]) => {
    const newTheme = flagsToTheme(flags);
    setTheme(newTheme);
  };

  useEffect(() => {
    // document.documentElement에 data-theme 속성 설정
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <WeatherThemeContext.Provider value={{ theme, setTheme, setThemeFromFlags }}>
      {children}
    </WeatherThemeContext.Provider>
  );
}