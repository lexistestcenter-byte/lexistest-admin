import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// GET: 문의 목록 조회 (+ 상태별 카운트)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || null;
    const category = searchParams.get("category") || null;
    const search = searchParams.get("search") || null;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 상태별 카운트 조회
    const { data: countData } = await supabase
      .from("inquiries")
      .select("status");

    const statusCounts = {
      all: countData?.length || 0,
      pending: countData?.filter((r) => r.status === "pending").length || 0,
      in_progress: countData?.filter((r) => r.status === "in_progress").length || 0,
      resolved: countData?.filter((r) => r.status === "resolved").length || 0,
      closed: countData?.filter((r) => r.status === "closed").length || 0,
    };

    // 문의 목록 조회
    let query = supabase
      .from("inquiries")
      .select("*, users(email, name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("inquiries GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      inquiries: data || [],
      statusCounts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + (data?.length || 0) < (count || 0),
      },
    });
  } catch (error) {
    console.error("Inquiries GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
