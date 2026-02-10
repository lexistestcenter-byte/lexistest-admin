import type { QuestionPreviewData } from "./types";

export function od(data: QuestionPreviewData) {
  return data.options_data || {};
}

export function getStr(obj: Record<string, unknown>, key: string, fallback = ""): string {
  return String(obj[key] || fallback);
}

export function getArr(obj: Record<string, unknown>, key: string): unknown[] {
  return Array.isArray(obj[key]) ? (obj[key] as unknown[]) : [];
}

export function getBool(obj: Record<string, unknown>, key: string): boolean {
  return Boolean(obj[key]);
}

/** Strip block-level <p> tags so content stays inline when split by [N] */
export function stripBlockTags(text: string): string {
  return text
    .replace(/<\/p>\s*<p[^>]*>/gi, "<br>")
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>$/i, "");
}
