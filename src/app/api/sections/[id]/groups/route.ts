import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection, UUID_REGEX } from "@/lib/utils/sanitize";

// GET: 섹션의 문제 그룹 목록 (그룹 내 문제 포함)
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

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("get_section_question_groups", {
      p_section_id: sectionId,
    });

    if (error) {
      console.error("Error fetching question groups:", error);
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

// POST: 문제 그룹 생성
export async function POST(
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

    const body = await request.json();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    // Validate content_block_id if provided
    if (body.content_block_id && !UUID_REGEX.test(body.content_block_id)) {
      return NextResponse.json(
        { error: "Invalid content_block_id format" },
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

    const { data, error } = await supabase.rpc("create_question_group", {
      p_section_id: sectionId,
      p_content_block_id: body.content_block_id || null,
      p_display_order: body.display_order ?? 0,
      p_title: body.title ? sanitizeHtml(body.title) : null,
      p_instructions: body.instructions ? sanitizeHtml(body.instructions) : null,
      p_question_number_start: body.question_number_start ?? 1,
    });

    if (error) {
      console.error("Error creating question group:", error);
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

// PUT: 그룹/문제 순서 일괄 재정렬
export async function PUT(
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

    const body = await request.json();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    if (!body.groups || !Array.isArray(body.groups)) {
      return NextResponse.json(
        { error: "groups array is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("reorder_groups_and_items", {
      p_section_id: sectionId,
      p_data: body,
    });

    if (error) {
      console.error("Error reordering groups:", error);
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
