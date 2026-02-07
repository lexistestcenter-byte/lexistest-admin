import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: 세션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 세션 조회
    const { data: session, error: sessionError } = await supabase
      .from("test_sessions")
      .select("*, users(name, email), packages(title)")
      .eq("id", id)
      .single();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      if (sessionError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    // 해당 세션의 응답 목록 조회
    const { data: responses, error: responsesError } = await supabase
      .from("test_responses")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return NextResponse.json(
        { error: responsesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: {
        ...session,
        responses: responses || [],
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

// PATCH: 세션 업데이트 (채점 상태 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const updateData: Record<string, unknown> = {};

    if (body.scoring_status !== undefined) {
      const validStatuses = [
        "not_scored",
        "auto_scored",
        "under_review",
        "finalized",
      ];
      if (!validStatuses.includes(body.scoring_status)) {
        return NextResponse.json(
          { error: "Invalid scoring_status" },
          { status: 400 }
        );
      }
      updateData.scoring_status = body.scoring_status;
    }
    if (body.reviewer_notes !== undefined) {
      updateData.reviewer_notes = body.reviewer_notes;
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
      .from("test_sessions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating session:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
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
