import { useEffect, useState } from 'react';
import type { LatLng, LiveWeatherRes } from '@/types';

export function useWeather(coords: LatLng | null) {
  const [data, setData] = useState<LiveWeatherRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(coords));

  useEffect(() => {
    if (!coords) return;
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        const url = new URL('/api/weather/live', window.location.origin);
        url.searchParams.set('lat', String(coords.lat));
        url.searchParams.set('lng', String(coords.lng));
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`WEATHER_${res.status}`);
        const json: LiveWeatherRes = await res.json();
        if (!aborted) setData(json);
      } catch (e: any) {
        if (!aborted) setError(e?.message || 'WEATHER_FAIL');
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [coords]);

  return { data, error, loading };
}
