import { useEffect, useState } from 'react';
import type { LatLng, RecoRes } from '@/types';

export function useRecommendation(coords: LatLng | null) {
  const [data, setData] = useState<RecoRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(coords));

  useEffect(() => {
    if (!coords) return;
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reco', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coords),
        });
        if (!res.ok) throw new Error(`RECO_${res.status}`);
        const json: RecoRes = await res.json();
        if (!aborted) setData(json);
      } catch (e: any) {
        if (!aborted) setError(e?.message || 'RECO_FAIL');
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [coords]);

  return { data, error, loading };
}
