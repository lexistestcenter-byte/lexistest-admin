const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

/**
 * 서브패스를 CDN 풀 URL로 변환.
 * - blob: URL → 그대로 (로컬 미리보기)
 * - http/https URL → 그대로 (레거시 호환)
 * - 그 외 → CDN 도메인 + 서브패스
 */
export function getCdnUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${CDN_URL}/${path}`;
}
