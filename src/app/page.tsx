'use client';
import { useEffect, useState } from 'react';

type RecoRes = { flags: string[]; menus: string[]; source?: string };

const FALLBACK_LAT = Number(process.env.NEXT_PUBLIC_FALLBACK_LAT ?? 37.5665);
const FALLBACK_LNG = Number(process.env.NEXT_PUBLIC_FALLBACK_LNG ?? 126.9780);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [source, setSource] = useState<string>('unknown');
  const [err, setErr] = useState<string|undefined>();
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const getPos = () => new Promise<GeolocationPosition>((ok, no) =>
          navigator.geolocation.getCurrentPosition(ok, no, { enableHighAccuracy:true, timeout:5000 })
        );
        let lat = FALLBACK_LAT, lng = FALLBACK_LNG;
        try {
          const pos = await getPos();
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          setUsedFallback(true);
        }

        const res = await fetch('/api/reco', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
        if (!res.ok) throw new Error('추천 실패');
        const json: RecoRes = await res.json();
        setFlags(json.flags || []);
        setMenus(json.menus || []);
        setSource(json.source || 'unknown');
      } catch (e:any) {
        setErr(e?.message || '오류');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center">로딩...</div>;
  if (err) return <div className="min-h-screen grid place-items-center text-red-600">에러: {err}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md bg-white rounded-xl shadow p-6 space-y-3">
        <h1 className="text-2xl font-extrabold">오늘 점심 추천</h1>
        <p className="text-sm text-gray-600">
          날씨 플래그: {flags.join(', ') || '없음'} <span className="ml-2 text-xs text-gray-400">({source})</span>
        </p>
        {usedFallback && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            위치 권한이 없어 기본 위치로 추천했어요.
          </div>
        )}
        <ul className="space-y-2">
          {menus.map(m => (
            <li key={m} className="p-3 rounded-lg border">{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
