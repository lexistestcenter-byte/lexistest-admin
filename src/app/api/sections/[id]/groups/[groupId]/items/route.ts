import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST: 그룹에 문제 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id: sectionId, groupId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!UUID_REGEX.test(sectionId) || !UUID_REGEX.test(groupId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const { question_id, question_number_start, display_order } = body;

    if (!question_id || !UUID_REGEX.test(question_id)) {
      return NextResponse.json(
        { error: "Valid question_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("add_question_to_group", {
      p_group_id: groupId,
      p_question_id: question_id,
      p_question_number_start: question_number_start ?? 1,
      p_display_order: display_order ?? 0,
    });

    if (error) {
      console.error("Error adding question to group:", error);
      if (error.message.includes("already")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
