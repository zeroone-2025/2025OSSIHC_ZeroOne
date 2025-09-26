export async function getCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GEO_UNAVAILABLE'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(`GEO_DENIED:${err.code}`)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}
