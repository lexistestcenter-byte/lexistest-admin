import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// ============================================================
// POST: 문제 복원 (soft delete 취소)
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // UUID 형식 체크
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid question ID format" },
        { status: 400 }
      );
    }

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
    const { data, error } = await supabase.rpc("restore_question", {
      p_id: id,
    });

    if (error) {
      console.error("restore_question error:", error);

      if (error.message.includes("Permission denied")) {
        return NextResponse.json(
          { error: "권한이 없습니다. admin 이상의 역할이 필요합니다." },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "문제가 복원되었습니다",
    });
  } catch (error) {
    console.error("Question restore error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
