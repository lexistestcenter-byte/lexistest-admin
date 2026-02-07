import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { containsSqlInjection, UUID_REGEX } from "@/lib/utils/sanitize";

// GET: 섹션에 추가 가능한 문제 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const search = searchParams.get("search") || null;
    const limit = parseInt(searchParams.get("limit") || "50");

    // SQL Injection 체크
    if (search && containsSqlInjection(search)) {
      return NextResponse.json(
        { error: "Invalid search query" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "get_available_questions_for_section",
      {
        p_section_id: sectionId,
        p_search: search,
        p_limit: limit,
      }
    );

    if (error) {
      console.error("Error fetching available questions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
