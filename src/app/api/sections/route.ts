import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

const SECTION_TYPES = ["listening", "reading", "writing", "speaking"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

// GET: 섹션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const sectionType = searchParams.get("section_type");
    const difficulty = searchParams.get("difficulty");
    const isActive = searchParams.get("is_active");
    const isPractice = searchParams.get("is_practice");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // SQL Injection 체크
    if (search && containsSqlInjection(search)) {
      return NextResponse.json(
        { error: "Invalid search query" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("sections")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (sectionType) {
      query = query.eq("section_type", sectionType);
    }
    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }
    if (isPractice !== null) {
      query = query.eq("is_practice", isPractice === "true");
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching sections:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sections: data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + (data?.length || 0),
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

// POST: 섹션 생성
export async function POST(request: NextRequest) {
  try {
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

    // 필수 필드 검증
    if (!body.section_type) {
      return NextResponse.json(
        { error: "section_type is required" },
        { status: 400 }
      );
    }
    if (!body.title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // section_type 검증
    if (!SECTION_TYPES.includes(body.section_type)) {
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

    // Sanitize
    const sectionData = {
      section_type: body.section_type,
      title: sanitizeHtml(body.title),
      description: body.description ? sanitizeHtml(body.description) : null,
      image_url: body.image_url || null,
      instruction_title: body.instruction_title
        ? sanitizeHtml(body.instruction_title)
        : null,
      instruction_html: body.instruction_html
        ? sanitizeHtml(body.instruction_html)
        : null,
      instruction_image_url: body.instruction_image_url || null,
      passage_title: body.passage_title
        ? sanitizeHtml(body.passage_title)
        : null,
      passage_content: body.passage_content
        ? sanitizeHtml(body.passage_content)
        : null,
      passage_footnotes: body.passage_footnotes
        ? sanitizeHtml(body.passage_footnotes)
        : null,
      audio_url: body.audio_url || null,
      audio_duration_seconds: body.audio_duration_seconds || null,
      audio_transcript: body.audio_transcript
        ? sanitizeHtml(body.audio_transcript)
        : null,
      time_limit_minutes: body.time_limit_minutes || null,
      difficulty: body.difficulty || null,
      is_practice: body.is_practice || false,
      tags: body.tags || null,
      is_active: body.is_active ?? true,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("sections")
      .insert(sectionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating section:", error);
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
