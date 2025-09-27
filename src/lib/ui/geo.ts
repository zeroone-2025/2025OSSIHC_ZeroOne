export async function getCoordsWithFallback() {
  const fallback = { lat: 37.5665, lng: 126.978 };
  try {
    const pos: GeolocationPosition = await new Promise((ok, no) =>
      navigator.geolocation.getCurrentPosition(ok, no, {
        enableHighAccuracy: true,
        timeout: 8000,
      })
    );
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      usedFallback: false,
    };
  } catch {
    return { ...fallback, usedFallback: true };
  }
}