import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import {
  isValidUUID,
  sanitizeHtml,
  sanitizeJsonb,
  sanitizeStringArray,
  containsSqlInjection,
} from "@/lib/utils/sanitize";

const VALID_SECTION_TYPES = [
  "listening",
  "reading",
  "writing",
  "speaking",
] as const;
const VALID_FEEDBACK_TYPES = [
  "ai_writing",
  "ai_speaking",
  "teacher",
] as const;

// GET: 세션 피드백 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return apiError("Invalid session ID format", 400);
  }

  const supabase = await getSupabase();

  // 세션 존재 확인
  const { data: session, error: sessionError } = await supabase
    .from("test_sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (sessionError || !session) {
    return apiError("Session not found", 404);
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching feedback:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data || []);
}

// POST: 피드백 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return apiError("Invalid session ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  // 세션 존재 확인
  const { data: session, error: sessionError } = await supabase
    .from("test_sessions")
    .select("id")
    .eq("id", id)
    .single();

  if (sessionError || !session) {
    return apiError("Session not found", 404);
  }

  // 필수 필드 검증
  if (!body.feedback_type) {
    return apiError("feedback_type is required", 400);
  }
  if (!VALID_FEEDBACK_TYPES.includes(body.feedback_type)) {
    return apiError(
      `Invalid feedback_type. Must be one of: ${VALID_FEEDBACK_TYPES.join(", ")}`,
      400
    );
  }

  if (body.section_type && !VALID_SECTION_TYPES.includes(body.section_type)) {
    return apiError(
      `Invalid section_type. Must be one of: ${VALID_SECTION_TYPES.join(", ")}`,
      400
    );
  }

  if (body.question_id && !isValidUUID(body.question_id)) {
    return apiError("Invalid question_id format", 400);
  }

  // 텍스트 필드 SQL injection 체크
  const textFields = [
    "teacher_comment",
    "corrected_version",
    "model_answer",
  ];
  for (const field of textFields) {
    if (body[field] && containsSqlInjection(body[field])) {
      return apiError(`Invalid ${field}`, 400);
    }
  }

  const feedbackData = {
    session_id: id,
    question_id: body.question_id || null,
    section_type: body.section_type || null,
    feedback_type: body.feedback_type,
    criteria_scores: body.criteria_scores
      ? sanitizeJsonb(body.criteria_scores)
      : null,
    strengths: sanitizeStringArray(body.strengths || null),
    weaknesses: sanitizeStringArray(body.weaknesses || null),
    suggestions: sanitizeStringArray(body.suggestions || null),
    corrections: body.corrections
      ? sanitizeJsonb(body.corrections)
      : null,
    corrected_version: body.corrected_version
      ? sanitizeHtml(body.corrected_version)
      : null,
    model_answer: body.model_answer
      ? sanitizeHtml(body.model_answer)
      : null,
    pronunciation_issues: body.pronunciation_issues
      ? sanitizeJsonb(body.pronunciation_issues)
      : null,
    teacher_comment: body.teacher_comment
      ? sanitizeHtml(body.teacher_comment)
      : null,
    is_public: body.is_public !== undefined ? body.is_public : true,
    created_by: validation.userId,
    ai_model_used: body.ai_model_used || null,
  };

  const { data, error } = await supabase
    .from("feedback")
    .insert(feedbackData)
    .select()
    .single();

  if (error) {
    console.error("Error creating feedback:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}

// PUT: 피드백 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return apiError("Invalid session ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  if (!body.feedback_id) {
    return apiError("feedback_id is required", 400);
  }
  if (!isValidUUID(body.feedback_id)) {
    return apiError("Invalid feedback_id format", 400);
  }

  // 텍스트 필드 SQL injection 체크
  const textFields = [
    "teacher_comment",
    "corrected_version",
    "model_answer",
  ];
  for (const field of textFields) {
    if (body[field] && containsSqlInjection(body[field])) {
      return apiError(`Invalid ${field}`, 400);
    }
  }

  const updateData: Record<string, unknown> = {};

  if (body.criteria_scores !== undefined)
    updateData.criteria_scores = body.criteria_scores
      ? sanitizeJsonb(body.criteria_scores)
      : null;
  if (body.strengths !== undefined)
    updateData.strengths = sanitizeStringArray(body.strengths || null);
  if (body.weaknesses !== undefined)
    updateData.weaknesses = sanitizeStringArray(body.weaknesses || null);
  if (body.suggestions !== undefined)
    updateData.suggestions = sanitizeStringArray(body.suggestions || null);
  if (body.corrections !== undefined)
    updateData.corrections = body.corrections
      ? sanitizeJsonb(body.corrections)
      : null;
  if (body.corrected_version !== undefined)
    updateData.corrected_version = body.corrected_version
      ? sanitizeHtml(body.corrected_version)
      : null;
  if (body.model_answer !== undefined)
    updateData.model_answer = body.model_answer
      ? sanitizeHtml(body.model_answer)
      : null;
  if (body.pronunciation_issues !== undefined)
    updateData.pronunciation_issues = body.pronunciation_issues
      ? sanitizeJsonb(body.pronunciation_issues)
      : null;
  if (body.teacher_comment !== undefined)
    updateData.teacher_comment = body.teacher_comment
      ? sanitizeHtml(body.teacher_comment)
      : null;
  if (body.is_public !== undefined) updateData.is_public = body.is_public;

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  // 해당 feedback이 이 세션에 속하는지 확인
  const { data, error } = await supabase
    .from("feedback")
    .update(updateData)
    .eq("id", body.feedback_id)
    .eq("session_id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating feedback:", error);
    if (error.code === "PGRST116") {
      return apiError("Feedback not found in this session", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}
