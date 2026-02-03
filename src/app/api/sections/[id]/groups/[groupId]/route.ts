import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PUT: 문제 그룹 수정
export async function PUT(
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

    // SQL injection checks
    for (const field of ["title", "instructions"]) {
      if (body[field] && containsSqlInjection(body[field])) {
        return NextResponse.json(
          { error: `Invalid ${field}` },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase.rpc("update_question_group", {
      p_group_id: groupId,
      p_content_block_id: body.content_block_id ?? null,
      p_display_order: body.display_order ?? null,
      p_title: body.title !== undefined ? (body.title ? sanitizeHtml(body.title) : null) : null,
      p_instructions: body.instructions !== undefined
        ? (body.instructions ? sanitizeHtml(body.instructions) : null)
        : null,
      p_question_number_start: body.question_number_start ?? null,
    });

    if (error) {
      console.error("Error updating question group:", error);
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

// DELETE: 문제 그룹 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id: sectionId, groupId } = await params;
    const supabase = await createClient();

    if (!UUID_REGEX.test(sectionId) || !UUID_REGEX.test(groupId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("remove_question_group", {
      p_group_id: groupId,
    });

    if (error) {
      console.error("Error removing question group:", error);
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
