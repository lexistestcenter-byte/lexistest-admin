import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// GET: 문의 상세 조회
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("inquiries")
      .select("*, users(email, name), admins(email, name)")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ inquiry: data });
  } catch (error) {
    console.error("Inquiry GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================
// PATCH: 문의 상태 변경 또는 답변 작성
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // 상태 변경
    if (body.status) {
      const validStatuses = ["pending", "in_progress", "resolved", "closed"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // 답변 작성
    if (body.reply !== undefined) {
      updateData.reply = body.reply;
      updateData.admin_id = user.id;
      updateData.replied_at = new Date().toISOString();
      // 답변 시 자동으로 resolved 상태로 변경
      if (!body.status) {
        updateData.status = "resolved";
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select("*, users(email, name), admins(email, name)")
      .single();

    if (error) {
      console.error("Inquiry PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inquiry: data });
  } catch (error) {
    console.error("Inquiry PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
