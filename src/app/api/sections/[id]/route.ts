import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECTION_TYPES = ["listening", "reading", "writing", "speaking"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

// GET: 섹션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching section:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Section not found" },
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

// PUT: 섹션 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    // section_type 검증
    if (body.section_type && !SECTION_TYPES.includes(body.section_type)) {
      return NextResponse.json(
        { error: `Invalid section_type. Must be one of: ${SECTION_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // difficulty 검증
    if (body.difficulty && !DIFFICULTIES.includes(body.difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Must be one of: ${DIFFICULTIES.join(", ")}` },
        { status: 400 }
      );
    }

    // SQL Injection 체크
    const textFields = [
      "title",
      "description",
      "instruction_title",
      "instruction_html",
      "passage_title",
      "passage_content",
      "passage_footnotes",
      "audio_transcript",
    ];
    for (const field of textFields) {
      if (body[field] && containsSqlInjection(body[field])) {
        return NextResponse.json(
          { error: `Invalid ${field}` },
          { status: 400 }
        );
      }
    }

    // 업데이트할 필드만 포함
    const updateData: Record<string, unknown> = {};

    if (body.section_type !== undefined)
      updateData.section_type = body.section_type;
    if (body.title !== undefined) updateData.title = sanitizeHtml(body.title);
    if (body.description !== undefined)
      updateData.description = body.description
        ? sanitizeHtml(body.description)
        : null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.instruction_title !== undefined)
      updateData.instruction_title = body.instruction_title
        ? sanitizeHtml(body.instruction_title)
        : null;
    if (body.instruction_html !== undefined)
      updateData.instruction_html = body.instruction_html
        ? sanitizeHtml(body.instruction_html)
        : null;
    if (body.instruction_image_url !== undefined)
      updateData.instruction_image_url = body.instruction_image_url;
    if (body.passage_title !== undefined)
      updateData.passage_title = body.passage_title
        ? sanitizeHtml(body.passage_title)
        : null;
    if (body.passage_content !== undefined)
      updateData.passage_content = body.passage_content
        ? sanitizeHtml(body.passage_content)
        : null;
    if (body.passage_footnotes !== undefined)
      updateData.passage_footnotes = body.passage_footnotes
        ? sanitizeHtml(body.passage_footnotes)
        : null;
    if (body.audio_url !== undefined) updateData.audio_url = body.audio_url;
    if (body.audio_duration_seconds !== undefined)
      updateData.audio_duration_seconds = body.audio_duration_seconds;
    if (body.audio_transcript !== undefined)
      updateData.audio_transcript = body.audio_transcript
        ? sanitizeHtml(body.audio_transcript)
        : null;
    if (body.time_limit_minutes !== undefined)
      updateData.time_limit_minutes = body.time_limit_minutes;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.is_practice !== undefined)
      updateData.is_practice = body.is_practice;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sections")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating section:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Section not found" },
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

// DELETE: 섹션 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("sections").delete().eq("id", id);

    if (error) {
      console.error("Error deleting section:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Section deleted" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
