// src/lib/ui/weatherIcon.ts
// Material Symbols (outlined) icon mapper for our weather model.

export type ProcessedWeather = {
  T1H?: number; // temperature (°C)
  REH?: number; // humidity (%)
  WSD?: number; // wind speed (m/s)
  SKY?: number; // 1=맑음, 3=구름많음, 4=흐림
  PTY?: number; // 0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기, 5=빗방울, 6=빗방울눈날림, 7=눈날림
  PCP?: number; // precipitation over 1 hour (mm)
  RN1?: number; // precipitation over last hour (mm)
  SNO?: number; // snowfall (cm)
};

/** Main weather glyph with strict priority:
 *  1) precipitation
 *  2) sky state
 *  3) temperature fallback
 */
export function pickMainWeatherIcon(p: ProcessedWeather | undefined): string {
  if (!p) return "thermostat";

  // 1) Precipitation first
  switch (p.PTY) {
    case 1: // 비
    case 4: // 소나기
    case 5: // 빗방울
      return "rainy";
    case 3: // 눈
    case 6: // 빗방울눈날림
    case 7: // 눈날림
      return "weather_snowy";
    case 2: // 비/눈
      return "cloudy_snowing";
    default:
      break;
  }

  // 2) Sky (if no precip)
  switch (p.SKY) {
    case 1:
      return "clear_day"; // 맑음
    case 3:
      return "cloud"; // 구름많음
    case 4:
      return "cloudy"; // 흐림
    default:
      break;
  }

  // 3) Temperature fallback
  if (isHot(p.T1H)) return "sunny";
  if (isCold(p.T1H)) return "ac_unit";

  return "thermostat";
}

/** Secondary hint icons (optional row of tiny glyphs) */
export function pickSecondaryIcons(p: ProcessedWeather | undefined): string[] {
  if (!p) return [];
  const out: string[] = [];
  if (p.REH != null && p.REH >= 80) out.push("water_drop"); // high humidity
  if (p.WSD != null && p.WSD >= 9) out.push("air"); // strong wind
  if (isHot(p.T1H)) out.push("device_thermostat"); // subtle temp hint
  if (isCold(p.T1H)) out.push("ac_unit");
  return out;
}

/** Convert weather icon to emoji */
export function getWeatherEmoji(icon: string): string {
  switch (icon) {
    case "clear_day":
    case "sunny":
      return "☀";
    case "cloud":
      return "⛅";
    case "cloudy":
      return "☁";
    case "rainy":
      return "🌧";
    case "weather_snowy":
      return "❄";
    case "cloudy_snowing":
      return "🌨";
    case "ac_unit":
      return "🥶";
    case "thermostat":
      return "🌡";
    case "water_drop":
      return "💧";
    case "air":
      return "💨";
    case "device_thermostat":
      return "🔥";
    default:
      return "🌤"; // default weather emoji
  }
}

/** Get main weather emoji based on processed weather data */
export function getMainWeatherEmoji(p: ProcessedWeather | undefined): string {
  const icon = pickMainWeatherIcon(p);
  return getWeatherEmoji(icon);
}

function isHot(t?: number) {
  return typeof t === "number" && t >= 28;
}
function isCold(t?: number) {
  return typeof t === "number" && t <= 10;
}
