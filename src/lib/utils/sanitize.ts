/**
 * 입력값 검증 및 정제 유틸리티
 * XSS, SQL Injection 방어
 */

// HTML 태그 제거 (일반 텍스트 필드용)
export function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

// 기본적인 XSS 방어를 위한 이스케이프
export function escapeHtml(str: string): string {
  if (!str) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

// 허용된 HTML 태그만 남기고 나머지 제거 (리치 텍스트 필드용)
const ALLOWED_TAGS = [
  "p", "br", "b", "i", "u", "strong", "em", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td", "span", "div", "a"
];

const ALLOWED_ATTRIBUTES = ["href", "target", "class", "style", "id"];

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // 위험한 태그 완전 제거
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "");

  // 이벤트 핸들러 제거 (onclick, onerror 등)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // javascript: 프로토콜 제거
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/data:/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");

  return sanitized;
}

// SQL Injection 위험 패턴 검사
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|OR|AND)\b.*\b(FROM|INTO|TABLE|DATABASE|WHERE|SET)\b)/i,
  /('|")\s*(OR|AND)\s*('|"|\d)/i,
  /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
  /--\s*$/m,
  /\/\*.*\*\//,
];

export function containsSqlInjection(str: string): boolean {
  if (!str) return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(str));
}

// 일반 텍스트 필드 정제
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text.trim();
}

// UUID 형식 검증
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// URL 형식 검증 (이미지, 오디오 URL용)
export function isValidUrl(url: string): boolean {
  if (!url) return true; // optional 필드
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 문자열 길이 검증
export function validateLength(
  str: string,
  min: number,
  max: number
): boolean {
  if (!str) return min === 0;
  return str.length >= min && str.length <= max;
}

// 배열 내 문자열 정제
export function sanitizeStringArray(arr: string[] | null): string[] | null {
  if (!arr) return null;
  return arr.map((s) => sanitizeText(s)).filter((s) => s.length > 0);
}

// JSONB 데이터 정제 (재귀적)
export function sanitizeJsonb(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJsonb);
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // 키 이름 검증 (알파벳, 숫자, 언더스코어만)
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        sanitized[key] = sanitizeJsonb(value);
      }
    }
    return sanitized;
  }

  return obj;
}

// 입력값 검증 결과 타입
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 문제 입력값 검증
export function validateQuestionInput(body: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  // 필수값 체크
  if (!body.question_type) {
    errors.push("문제 유형(question_type)은 필수입니다");
  }

  if (!body.question_format) {
    errors.push("문제 형식(question_format)은 필수입니다");
  }

  if (!body.content || (body.content as string).trim() === "") {
    errors.push("문제 내용(content)은 필수입니다");
  }

  // URL 검증
  if (body.image_url && !isValidUrl(body.image_url as string)) {
    errors.push("유효하지 않은 이미지 URL입니다");
  }

  if (body.audio_url && !isValidUrl(body.audio_url as string)) {
    errors.push("유효하지 않은 오디오 URL입니다");
  }

  // 길이 검증
  if (body.content && !validateLength(body.content as string, 1, 50000)) {
    errors.push("문제 내용은 50,000자를 초과할 수 없습니다");
  }

  if (body.title && !validateLength(body.title as string, 0, 500)) {
    errors.push("제목은 500자를 초과할 수 없습니다");
  }

  // SQL Injection 패턴 검사 (텍스트 필드만)
  const textFields = ["content", "title", "instructions"];
  for (const field of textFields) {
    if (body[field] && containsSqlInjection(body[field] as string)) {
      errors.push(`${field} 필드에 허용되지 않은 패턴이 포함되어 있습니다`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 입력값 정제
export function sanitizeQuestionInput(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ...body,
    content: body.content ? sanitizeHtml(body.content as string) : null,
    title: body.title ? sanitizeText(body.title as string) : null,
    instructions: body.instructions ? sanitizeHtml(body.instructions as string) : null,
    image_url: body.image_url ? sanitizeText(body.image_url as string) : null,
    audio_url: body.audio_url ? sanitizeText(body.audio_url as string) : null,
    audio_transcript: body.audio_transcript ? sanitizeHtml(body.audio_transcript as string) : null,
    options_data: body.options_data ? sanitizeJsonb(body.options_data) : null,
    answer_data: body.answer_data ? sanitizeJsonb(body.answer_data) : null,
    model_answers: body.model_answers ? sanitizeJsonb(body.model_answers) : null,
    tags: sanitizeStringArray(body.tags as string[] | null),
  };
}
