interface Location {
  lat: number;
  lng: number;
}

interface KakaoRouteResponse {
  routes: Array<{
    summary: {
      duration: number;
    };
  }>;
}

export async function getEtaMinutes(origin: Location, dest: Location): Promise<number> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error('KAKAO_REST_API_KEY is required');
  }

  try {
    const response = await fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}&waypoints=&priority=RECOMMEND&car_fuel=GASOLINE&car_hipass=false&alternatives=false&road_details=false`,
      {
        headers: {
          'Authorization': `KakaoAK ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }

    const data: KakaoRouteResponse = await response.json();
    const durationInSeconds = data.routes[0]?.summary?.duration || 0;
    return Math.round(durationInSeconds / 60);
  } catch (error) {
    console.error('Failed to get ETA from Kakao:', error);
    throw error;
  }
}

export async function getMultipleEtas(
  origin: Location,
  destinations: Location[],
  concurrency: number = 5
): Promise<number[]> {
  const results: number[] = [];

  for (let i = 0; i < destinations.length; i += concurrency) {
    const batch = destinations.slice(i, i + concurrency);
    const batchPromises = batch.map(dest => getEtaMinutes(origin, dest));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}