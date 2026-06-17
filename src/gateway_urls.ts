export const DEFAULT_PRIMARY_BASE_URL =
  "https://api.opencdp.io/gateway/data-gateway";

export const DEFAULT_FALLBACK_BASE_URLS = [
  "https://api.opencdp.com/gateway/data-gateway",
  "https://api.opencdp.xyz/gateway/data-gateway",
];

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function resolveAllBaseUrls(
  primaryOverride?: string,
  fallbackOverrides?: string[]
): string[] {
  const primary = normalizeBaseUrl(
    primaryOverride && primaryOverride.trim()
      ? primaryOverride
      : DEFAULT_PRIMARY_BASE_URL
  );
  const fallbacks = fallbackOverrides ?? DEFAULT_FALLBACK_BASE_URLS;
  const seen = new Set<string>();
  const ordered: string[] = [];

  const add = (url: string) => {
    const normalized = normalizeBaseUrl(url);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    ordered.push(normalized);
  };

  add(primary);
  for (const fallback of fallbacks) {
    add(fallback);
  }
  return ordered;
}
