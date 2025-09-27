export function resolveMenuImage(picture?: string, _fallbackName?: string): string {
  if (picture && typeof picture === 'string') {
    const p = picture
      .replace(/^public\//, '/')
      .replace(/^src\/data\/jommechu\/photo\/?/, '/jommechu/photo/');
    return p.startsWith('/') ? p : `/${p}`;
  }
  return '/placeholder.png';
}
