/**
 * Backward-compatible Image Resolver Adapter for Quick Finder.
 * Supports:
 * 1. Structured Storage objects: { downloadUrl, storagePath } -> returns downloadUrl
 * 2. Legacy Base64 Data URIs: "data:image/png;base64,..." -> returns base64 string
 * 3. Direct HTTP/HTTPS URLs: "https://..." -> returns URL string
 * 4. Fallback default image placeholder if null or invalid.
 */

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23e2e8f0"/><path d="M160 120a20 20 0 100-40 20 20 0 000 40zm-40 100l60-80 40 50 40-30 60 60H120z" fill="%2394a3b8"/></svg>';

export function resolveItemImage(img) {
  if (!img) return DEFAULT_PLACEHOLDER;
  
  if (typeof img === 'object') {
    if (img.downloadUrl) return img.downloadUrl;
    if (img.url) return img.url;
    if (img.dataUri) return img.dataUri;
    return DEFAULT_PLACEHOLDER;
  }

  if (typeof img === 'string') {
    const trimmed = img.trim();
    if (!trimmed) return DEFAULT_PLACEHOLDER;
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
  }

  return DEFAULT_PLACEHOLDER;
}

export function resolveItemImages(imagesArray) {
  if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
    return [DEFAULT_PLACEHOLDER];
  }
  return imagesArray.map((img) => resolveItemImage(img));
}
