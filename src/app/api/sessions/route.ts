import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
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

    const status = searchParams.get("status");
    const scoringStatus = searchParams.get("scoring_status");
    const mode = searchParams.get("mode");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 세션 목록 쿼리
    let query = supabase
      .from("test_sessions")
      .select("*, users(name, email), packages(title)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (scoringStatus) {
      query = query.eq("scoring_status", scoringStatus);
    }
    if (mode) {
      query = query.eq("mode", mode);
    }
    if (search) {
      query = query.or(
        `users.name.ilike.%${search}%,users.email.ilike.%${search}%`,
        { referencedTable: "users" }
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 채점 상태별 카운트 조회
    const { data: allSessions, error: countError } = await supabase
      .from("test_sessions")
      .select("scoring_status");

    let scoringCounts = {
      all: 0,
      not_scored: 0,
      auto_scored: 0,
      under_review: 0,
      finalized: 0,
    };

    if (!countError && allSessions) {
      scoringCounts.all = allSessions.length;
      for (const s of allSessions) {
        const key = s.scoring_status as keyof typeof scoringCounts;
        if (key in scoringCounts && key !== "all") {
          scoringCounts[key]++;
        }
      }
    }

    return NextResponse.json({
      sessions: data || [],
      scoringCounts,
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
