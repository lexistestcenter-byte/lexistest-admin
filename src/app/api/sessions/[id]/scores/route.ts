import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

const VALID_SCORE_TYPES = ["section", "overall"] as const;
const VALID_SECTION_TYPES = [
  "listening",
  "reading",
  "writing",
  "speaking",
] as const;

// GET: 세션 점수 조회
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
    .from("scores")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching scores:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data || []);
}

// POST: 점수 생성
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
  if (!body.score_type) {
    return apiError("score_type is required", 400);
  }
  if (!VALID_SCORE_TYPES.includes(body.score_type)) {
    return apiError(
      `Invalid score_type. Must be one of: ${VALID_SCORE_TYPES.join(", ")}`,
      400
    );
  }

  if (body.band_score === undefined || body.band_score === null) {
    return apiError("band_score is required", 400);
  }
  if (body.band_score < 0 || body.band_score > 9.0) {
    return apiError("band_score must be between 0 and 9.0", 400);
  }

  // section 타입 검증
  if (body.score_type === "section") {
    if (!body.section_type) {
      return apiError("section_type is required for section scores", 400);
    }
    if (!VALID_SECTION_TYPES.includes(body.section_type)) {
      return apiError(
        `Invalid section_type. Must be one of: ${VALID_SECTION_TYPES.join(", ")}`,
        400
      );
    }
  }

  const scoreData = {
    session_id: id,
    score_type: body.score_type,
    section_type: body.score_type === "section" ? body.section_type : null,
    raw_score: body.raw_score ?? null,
    band_score: body.band_score,
    score_details: body.score_details || null,
    adjusted_score: body.adjusted_score ?? null,
    adjustment_reason: body.adjustment_reason || null,
    adjusted_by: body.adjusted_score !== undefined ? validation.userId : null,
  };

  const { data, error } = await supabase
    .from("scores")
    .insert(scoreData)
    .select()
    .single();

  if (error) {
    console.error("Error creating score:", error);
    if (error.code === "23505") {
      return apiError(
        "Score already exists for this session/type/section combination",
        409
      );
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}

// PUT: 점수 수정
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

  if (!body.score_id) {
    return apiError("score_id is required", 400);
  }
  if (!isValidUUID(body.score_id)) {
    return apiError("Invalid score_id format", 400);
  }

  // band_score 검증
  if (body.band_score !== undefined) {
    if (body.band_score < 0 || body.band_score > 9.0) {
      return apiError("band_score must be between 0 and 9.0", 400);
    }
  }

  const updateData: Record<string, unknown> = {};

  if (body.raw_score !== undefined) updateData.raw_score = body.raw_score;
  if (body.band_score !== undefined) updateData.band_score = body.band_score;
  if (body.score_details !== undefined)
    updateData.score_details = body.score_details;
  if (body.adjusted_score !== undefined) {
    updateData.adjusted_score = body.adjusted_score;
    updateData.adjusted_by = validation.userId;
  }
  if (body.adjustment_reason !== undefined)
    updateData.adjustment_reason = body.adjustment_reason;

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  // 해당 score가 이 세션에 속하는지 확인
  const { data, error } = await supabase
    .from("scores")
    .update(updateData)
    .eq("id", body.score_id)
    .eq("session_id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating score:", error);
    if (error.code === "PGRST116") {
      return apiError("Score not found in this session", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}
