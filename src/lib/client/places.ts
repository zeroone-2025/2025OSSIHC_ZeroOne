export type NearbyPlace = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
  categoryPath: string[];
  placeUrl: string;
};

export async function loadNearby(
  lat: number,
  lng: number,
  radius = 900,
  categoryGroupCode = 'FD6'
): Promise<NearbyPlace[]> {
  const res = await fetch('/api/places/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, radius, categoryGroupCode }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LOAD_NEARBY_FAIL:${res.status}:${detail}`);
  }
  const json = await res.json();
  return json.items ?? [];
}
