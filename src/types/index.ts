export type WeatherFlags = 'cold' | 'hot' | 'rain' | 'snow' | 'humid' | 'windy' | 'gloom' | 'cloudy';

export interface WeatherMeta {
  T?: number; RH?: number; SKY?: number; PTY?: number; PCP?: number; SNO?: number; WSD?: number;
  base_date?: string; base_time?: string; nx?: number; ny?: number;
}

export interface LiveWeatherRes {
  flags: WeatherFlags[];
  meta?: WeatherMeta;
}

export interface RecoRes {
  flags: WeatherFlags[];
  menus: string[];
}

export interface LatLng {
  lat: number;
  lng: number;
}
