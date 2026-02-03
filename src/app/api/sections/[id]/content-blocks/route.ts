import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: 섹션의 콘텐츠 블록 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("get_section_content_blocks", {
      p_section_id: sectionId,
    });

    if (error) {
      console.error("Error fetching content blocks:", error);
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

// POST: 콘텐츠 블록 생성/수정
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    // SQL Injection checks
    const textFields = ["passage_title", "passage_content", "passage_footnotes", "audio_transcript"];
    for (const field of textFields) {
      if (body[field] && containsSqlInjection(body[field])) {
        return NextResponse.json(
          { error: `Invalid ${field}` },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase.rpc("upsert_content_block", {
      p_section_id: sectionId,
      p_block_id: body.block_id || null,
      p_display_order: body.display_order ?? 0,
      p_content_type: body.content_type || "passage",
      p_passage_title: body.passage_title ? sanitizeHtml(body.passage_title) : null,
      p_passage_content: body.passage_content ? sanitizeHtml(body.passage_content) : null,
      p_passage_footnotes: body.passage_footnotes ? sanitizeHtml(body.passage_footnotes) : null,
      p_audio_url: body.audio_url || null,
      p_audio_duration_seconds: body.audio_duration_seconds || null,
      p_audio_transcript: body.audio_transcript ? sanitizeHtml(body.audio_transcript) : null,
    });

    if (error) {
      console.error("Error upserting content block:", error);
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

// DELETE: 콘텐츠 블록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get("block_id");

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    if (!blockId || !UUID_REGEX.test(blockId)) {
      return NextResponse.json(
        { error: "Valid block_id query parameter is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("remove_content_block", {
      p_block_id: blockId,
    });

    if (error) {
      console.error("Error removing content block:", error);
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
