import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH: 개별 응답 채점
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id, responseId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 해당 응답이 이 세션에 속하는지 확인
    const { data: existing, error: checkError } = await supabase
      .from("test_responses")
      .select("id")
      .eq("id", responseId)
      .eq("session_id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Response not found in this session" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.admin_score !== undefined) {
      updateData.admin_score = body.admin_score;
      // final_score는 admin_score가 제공되면 자동으로 설정
      updateData.final_score = body.admin_score;
    }
    if (body.admin_feedback !== undefined) {
      updateData.admin_feedback = body.admin_feedback;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateData.reviewed_by = user.id;
    updateData.reviewed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("test_responses")
      .update(updateData)
      .eq("id", responseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating response:", error);
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
