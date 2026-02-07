import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 특정 학생의 세션 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("test_sessions")
      .select("*, packages(title)", { count: "exact" })
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching student sessions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sessions: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + (data?.length || 0),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
