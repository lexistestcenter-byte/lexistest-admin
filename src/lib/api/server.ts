import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// API 요청 검증 헤더
const API_REQUEST_HEADER = "x-api-request";
const API_REQUEST_VALUE = "internal";

/**
 * API 라우트 보안 검증
 * - 내부 요청 헤더 확인
 * - Origin/Referer 확인
 * - 인증 상태 확인
 */
export async function validateApiRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  userId?: string;
}> {
  // 1. 내부 요청 헤더 확인
  const apiHeader = request.headers.get(API_REQUEST_HEADER);
  if (apiHeader !== API_REQUEST_VALUE) {
    return { valid: false, error: "Invalid request source" };
  }

  // 2. Origin 확인 (브라우저에서 직접 접근 차단)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Origin이 있으면 host와 일치하는지 확인
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return { valid: false, error: "Invalid origin" };
    }
  }

  // Referer가 있으면 host와 일치하는지 확인
  if (referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      return { valid: false, error: "Invalid referer" };
    }
  }

  // 3. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { valid: false, error: "Unauthorized" };
  }

  // 4. 관리자 활성 상태 확인
  const { data: admin } = await supabase
    .from("admins")
    .select("is_active, role")
    .eq("id", user.id)
    .single();

  if (!admin || !admin.is_active) {
    return { valid: false, error: "Account inactive" };
  }

  return { valid: true, userId: user.id };
}

/**
 * API 에러 응답 생성
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * API 성공 응답 생성
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Supabase 서버 클라이언트 가져오기
 */
export { createClient as getSupabase } from "@/lib/supabase/server";
