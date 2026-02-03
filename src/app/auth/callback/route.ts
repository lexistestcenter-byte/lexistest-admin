import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // 로그인 성공 - 대시보드로 리다이렉트
        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error("exchangeCodeForSession error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    } catch (err) {
      console.error("Auth callback error:", err);
      const message = err instanceof Error ? err.message : "unknown_error";
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(message)}`
      );
    }
  }

  // 에러 발생 시 로그인 페이지로 (에러 메시지 포함)
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
