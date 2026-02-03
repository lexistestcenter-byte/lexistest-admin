import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Speaking 카테고리 목록 조회
export async function GET() {
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

    // RPC 호출
    const { data, error } = await supabase.rpc("get_speaking_categories");

    if (error) {
      console.error("get_speaking_categories error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories: data || [] });
  } catch (error) {
    console.error("Speaking categories GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
