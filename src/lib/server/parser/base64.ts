/**
 * Safely decode Base64 string, handling URL-safe variants and padding.
 */
export const decodeBase64 = (str: string): string => {
  try {
    let base64 = str.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Failed to decode base64:', str?.substring(0, 20) + '...', e);
    return '';
  }
};

/**
 * Heuristic: check if a string looks like Base64-encoded data.
 */
export const isLikelyBase64 = (str: string): boolean => {
  const trimmed = str.replace(/[\s\r\n\uFEFF]/g, '');
  if (trimmed.length < 20) return false;
  if (!/^[A-Za-z0-9+/=_\-]+$/.test(trimmed)) return false;
  if (str.includes('://') || str.includes('proxies:')) return false;
  return true;
};

/**
 * URL-safe Base64 decode for SSR params.
 */
export const decodeUrlSafeBase64 = (str: string): string => {
  return decodeBase64(str.replace(/-/g, '+').replace(/_/g, '/'));
};
