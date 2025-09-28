/**
 * Resolves menu image URL. If no image is provided, returns a placeholder.
 * @param imageSource - The source image URL or path
 * @param menuName - The name of the menu item
 * @returns A resolved image URL
 */
export function resolveMenuImage(imageSource: string | undefined, menuName: string): string {
  // If we have a valid image source, use it
  if (imageSource && typeof imageSource === 'string' && imageSource.trim()) {
    // If it's already a full URL, return as is
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      return imageSource;
    }

    // If it's a path from src/data/jommechu/photo, convert to public path
    if (imageSource.includes('src/data/jommechu/photo/')) {
      const filename = imageSource.split('/').pop();
      return `/jommechu/photo/${filename}`;
    }

    // If it's a relative path starting with /, assume it's from public directory
    if (imageSource.startsWith('/')) {
      return imageSource;
    }

    // Otherwise, prepend / to make it a public path
    return '/' + imageSource;
  }

  // Try to find image by menu name in jommechu directory
  if (menuName && typeof menuName === 'string') {
    // First try exact name match
    const possibleNames = [
      menuName,
      menuName.replace(/\s+/g, ''), // Remove spaces
      menuName.replace(/\([^)]*\)/g, '').trim(), // Remove parentheses content
    ];

    for (const name of possibleNames) {
      // Try common variations
      const variations = [
        name,
        name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        name.toLowerCase(),
        name.toUpperCase(),
      ];

      for (const variation of variations) {
        // Try with .png extension
        const imagePath = `/jommechu/photo/${variation}.png`;
        // We'll return the path - the browser will handle 404s gracefully
        return imagePath;
      }
    }
  }

  // Fallback to placeholder image
  return '/placeholder.png';
}