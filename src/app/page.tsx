'use client';
import { useEffect, useState } from 'react';

type RecoRes = { flags: string[]; menus: string[] };

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const pos = await new Promise<GeolocationPosition>((ok, no) =>
          navigator.geolocation.getCurrentPosition(ok, no, { enableHighAccuracy: true, timeout: 8000 }),
        );
        const res = await fetch('/api/reco', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        if (!res.ok) throw new Error('추천 실패');
        const json: RecoRes = await res.json();
        setFlags(json.flags || []);
        setMenus(json.menus || []);
      } catch (e: any) {
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
      <div className="mx-auto max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-extrabold mb-2">오늘 점심 추천</h1>
        <p className="text-sm text-gray-600 mb-4">날씨 플래그: {flags.join(', ') || '없음'}</p>
        <ul className="space-y-2">
          {menus.map((m) => (
            <li key={m} className="p-3 rounded-lg border">{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
