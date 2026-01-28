import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateQuestionInput,
  sanitizeQuestionInput,
  sanitizeText,
} from "@/lib/utils/sanitize";

// Reading 문제 형식
const READING_FORMATS = [
  "fill_blank_typing",
  "fill_blank_drag",
  "heading_matching",
  "mcq",
  "flowchart",
] as const;

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

// ============================================================
// GET: 문제 목록 조회
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const questionType = searchParams.get("question_type") || null;
    const questionFormat = searchParams.get("question_format") || null;
    const difficulty = searchParams.get("difficulty") || null;
    const isActive = searchParams.get("is_active");
    const isPractice = searchParams.get("is_practice");
    const search = searchParams.get("search") || null;
    const tagsParam = searchParams.get("tags");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // tags 파싱 (쉼표 구분)
    const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()) : null;

    // RPC 호출
    const { data, error } = await supabase.rpc("get_questions", {
      p_question_type: questionType,
      p_question_format: questionFormat,
      p_difficulty: difficulty,
      p_is_active: isActive === null ? null : isActive === "true",
      p_is_practice: isPractice === null ? null : isPractice === "true",
      p_search: search,
      p_tags: tags,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("get_questions error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // total_count 추출 (첫 번째 row에서)
    const totalCount = data && data.length > 0 ? data[0].total_count : 0;

    // total_count 필드 제거한 결과 반환
    const questions = data?.map(({ total_count, ...rest }: { total_count: number }) => rest) || [];

    return NextResponse.json({
      questions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + questions.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Questions GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: 문제 생성
// ============================================================
export async function POST(request: NextRequest) {
  try {
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

    // ========== 입력값 검증 (XSS, SQL Injection 방어) ==========
    const validation = validateQuestionInput(body);

    // 추가 검증
    const errors = [...validation.errors];

    // Reading 타입인 경우 형식 체크
    if (
      body.question_type === "reading" &&
      body.question_format &&
      !READING_FORMATS.includes(body.question_format)
    ) {
      errors.push(
        `유효하지 않은 Reading 형식입니다. 가능한 값: ${READING_FORMATS.join(", ")}`
      );
    }

    // difficulty 체크
    if (
      body.difficulty &&
      !DIFFICULTIES.includes(body.difficulty)
    ) {
      errors.push(
        `유효하지 않은 난이도입니다. 가능한 값: ${DIFFICULTIES.join(", ")}`
      );
    }

    // points 범위 체크
    if (body.points !== undefined && (body.points < 1 || body.points > 10)) {
      errors.push("배점(points)은 1~10 사이여야 합니다");
    }

    // 에러가 있으면 반환
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // 입력값 정제 (XSS 방어)
    const sanitizedBody = sanitizeQuestionInput(body);

    // RPC 호출 (정제된 데이터 사용)
    const { data, error } = await supabase.rpc("create_question", {
      p_question_type: sanitizeText(body.question_type),
      p_question_format: sanitizeText(body.question_format),
      p_content: sanitizedBody.content,
      p_title: sanitizedBody.title,
      p_instructions: sanitizedBody.instructions,
      p_image_url: sanitizedBody.image_url,
      p_options_data: sanitizedBody.options_data,
      p_answer_data: sanitizedBody.answer_data,
      p_model_answers: sanitizedBody.model_answers,
      p_audio_url: sanitizedBody.audio_url,
      p_audio_duration_seconds: body.audio_duration_seconds || null,
      p_audio_transcript: sanitizedBody.audio_transcript,
      p_points: body.points || 1,
      p_difficulty: body.difficulty ? sanitizeText(body.difficulty) : null,
      p_is_practice: body.is_practice || false,
      p_generate_followup: body.generate_followup || false,
      p_tags: sanitizedBody.tags,
    });

    if (error) {
      console.error("create_question error:", error);

      // 권한 에러 처리
      if (error.message.includes("Permission denied")) {
        return NextResponse.json(
          { error: "권한이 없습니다. editor 이상의 역할이 필요합니다." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const result = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error("Questions POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
