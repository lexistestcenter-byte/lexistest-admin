import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Part 2 질문 목록 조회 (Part 3 연결용)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // RPC 호출
    const { data, error } = await supabase.rpc("get_part2_questions", {
      p_search: search,
      p_limit: limit,
    });

    if (error) {
      console.error("get_part2_questions error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: data || [] });
  } catch (error) {
    console.error("Part 2 questions GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
