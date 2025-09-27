import { useEffect, useState } from 'react';
import type { LatLng } from '@/types';

export function useGeolocation(opts?: PositionOptions) {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const enableHighAccuracy = opts?.enableHighAccuracy ?? true;
  const timeout = opts?.timeout ?? 8000;
  const maximumAge = opts?.maximumAge;

  useEffect(() => {
    let mounted = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        if (!mounted) return;
        setError(err.message || 'GEO_ERROR');
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout,
        ...(maximumAge !== undefined ? { maximumAge } : {}),
      }
    );
    return () => { mounted = false; };
  }, [enableHighAccuracy, timeout, maximumAge]);

  return { coords, error, loading };
}
