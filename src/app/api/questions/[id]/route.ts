import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeJsonb,
  sanitizeStringArray,
  isValidUrl,
  containsSqlInjection,
} from "@/lib/utils/sanitize";

const READING_FORMATS = [
  "fill_blank_typing",
  "fill_blank_drag",
  "heading_matching",
  "mcq",
  "flowchart",
] as const;

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

// UUID 형식 체크
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================================
// GET: 문제 상세 조회
// ============================================================
export async function GET(
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
    const { data, error } = await supabase.rpc("get_question_by_id", {
      p_id: id,
    });

    if (error) {
      console.error("get_question_by_id error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ question: data[0] });
  } catch (error) {
    console.error("Question GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT: 문제 수정
// ============================================================
export async function PUT(
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

    const body = await request.json();

    // ========== 검증 (XSS, SQL Injection 방어) ==========
    const errors: string[] = [];

    // question_format 체크 (제공된 경우)
    if (
      body.question_format &&
      body.question_type === "reading" &&
      !READING_FORMATS.includes(body.question_format)
    ) {
      errors.push(
        `유효하지 않은 Reading 형식입니다. 가능한 값: ${READING_FORMATS.join(", ")}`
      );
    }

    // difficulty 체크 (제공된 경우)
    if (body.difficulty && !DIFFICULTIES.includes(body.difficulty)) {
      errors.push(
        `유효하지 않은 난이도입니다. 가능한 값: ${DIFFICULTIES.join(", ")}`
      );
    }

    // points 범위 체크 (제공된 경우)
    if (body.points !== undefined && (body.points < 1 || body.points > 10)) {
      errors.push("배점(points)은 1~10 사이여야 합니다");
    }

    // content가 빈 문자열이면 안됨
    if (body.content !== undefined && body.content.trim() === "") {
      errors.push("문제 내용(content)은 빈 값일 수 없습니다");
    }

    // URL 검증
    if (body.image_url && !isValidUrl(body.image_url)) {
      errors.push("유효하지 않은 이미지 URL입니다");
    }

    if (body.audio_url && !isValidUrl(body.audio_url)) {
      errors.push("유효하지 않은 오디오 URL입니다");
    }

    // SQL Injection 패턴 검사
    const textFields = ["content", "title", "instructions"];
    for (const field of textFields) {
      if (body[field] && containsSqlInjection(body[field])) {
        errors.push(`${field} 필드에 허용되지 않은 패턴이 포함되어 있습니다`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // 입력값 정제 (XSS 방어)
    const sanitizedContent = body.content ? sanitizeHtml(body.content) : null;
    const sanitizedTitle = body.title !== undefined ? sanitizeText(body.title) : null;
    const sanitizedInstructions = body.instructions !== undefined ? sanitizeHtml(body.instructions) : null;
    const sanitizedImageUrl = body.image_url !== undefined ? sanitizeText(body.image_url) : null;
    const sanitizedAudioUrl = body.audio_url !== undefined ? sanitizeText(body.audio_url) : null;
    const sanitizedAudioTranscript = body.audio_transcript !== undefined ? sanitizeHtml(body.audio_transcript) : null;
    const sanitizedOptionsData = body.options_data ? sanitizeJsonb(body.options_data) : null;
    const sanitizedAnswerData = body.answer_data ? sanitizeJsonb(body.answer_data) : null;
    const sanitizedModelAnswers = body.model_answers ? sanitizeJsonb(body.model_answers) : null;
    const sanitizedTags = sanitizeStringArray(body.tags);

    // RPC 호출 (정제된 데이터 사용)
    const { data, error } = await supabase.rpc("update_question", {
      p_id: id,
      p_question_format: body.question_format ? sanitizeText(body.question_format) : null,
      p_content: sanitizedContent,
      p_title: sanitizedTitle,
      p_instructions: sanitizedInstructions,
      p_image_url: sanitizedImageUrl,
      p_options_data: sanitizedOptionsData,
      p_answer_data: sanitizedAnswerData,
      p_model_answers: sanitizedModelAnswers,
      p_audio_url: sanitizedAudioUrl,
      p_audio_duration_seconds: body.audio_duration_seconds || null,
      p_audio_transcript: sanitizedAudioTranscript,
      p_points: body.points || null,
      p_difficulty: body.difficulty ? sanitizeText(body.difficulty) : null,
      p_is_practice: body.is_practice !== undefined ? body.is_practice : null,
      p_generate_followup:
        body.generate_followup !== undefined ? body.generate_followup : null,
      p_tags: sanitizedTags,
      p_is_active: body.is_active !== undefined ? body.is_active : null,
    });

    if (error) {
      console.error("update_question error:", error);

      if (error.message.includes("Permission denied")) {
        return NextResponse.json(
          { error: "권한이 없습니다. editor 이상의 역할이 필요합니다." },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Question PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE: 문제 삭제 (soft delete)
// ============================================================
export async function DELETE(
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

    // hard delete 여부 확인
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    let data, error;

    if (hardDelete) {
      // 완전 삭제 (super_admin만)
      const result = await supabase.rpc("hard_delete_question", { p_id: id });
      data = result.data;
      error = result.error;
    } else {
      // Soft delete (admin 이상)
      const result = await supabase.rpc("soft_delete_question", { p_id: id });
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("delete_question error:", error);

      if (error.message.includes("Permission denied")) {
        const requiredRole = hardDelete ? "super_admin" : "admin";
        return NextResponse.json(
          { error: `권한이 없습니다. ${requiredRole} 이상의 역할이 필요합니다.` },
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
      message: hardDelete ? "문제가 완전히 삭제되었습니다" : "문제가 비활성화되었습니다",
    });
  } catch (error) {
    console.error("Question DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
