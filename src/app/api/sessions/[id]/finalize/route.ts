import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// POST: 세션 채점 최종 확정
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

  // 세션 존재 및 상태 확인
  const { data: session, error: sessionError } = await supabase
    .from("test_sessions")
    .select("id, scoring_status, status")
    .eq("id", id)
    .single();

  if (sessionError || !session) {
    return apiError("Session not found", 404);
  }

  if (session.scoring_status === "finalized") {
    return apiError("Session is already finalized", 400);
  }

  // scores 테이블에서 섹션별 band_score 가져오기
  const { data: sectionScores, error: scoresError } = await supabase
    .from("scores")
    .select("score_type, section_type, band_score")
    .eq("session_id", id)
    .eq("score_type", "section");

  if (scoresError) {
    console.error("Error fetching section scores:", scoresError);
    return apiError(scoresError.message, 500);
  }

  // test_responses에서 final_score 평균도 계산 (fallback)
  const { data: responses, error: responsesError } = await supabase
    .from("test_responses")
    .select("final_score")
    .eq("session_id", id)
    .eq("response_type", "answer");

  if (responsesError) {
    console.error("Error fetching responses:", responsesError);
    return apiError(responsesError.message, 500);
  }

  // 전체 band score 계산: scores 테이블의 섹션 점수가 있으면 그것으로, 없으면 responses의 final_score 평균
  let overallBandScore: number | null = null;

  if (sectionScores && sectionScores.length > 0) {
    const sum = sectionScores.reduce(
      (acc, s) => acc + Number(s.band_score),
      0
    );
    // IELTS 공식: 평균에서 가장 가까운 0.5 단위로 반올림
    const avg = sum / sectionScores.length;
    overallBandScore = Math.round(avg * 2) / 2;
  } else {
    // fallback: test_responses의 final_score 평균
    const scoredResponses = (responses || []).filter(
      (r) => r.final_score !== null && r.final_score !== undefined
    );
    if (scoredResponses.length > 0) {
      const sum = scoredResponses.reduce(
        (acc, r) => acc + Number(r.final_score),
        0
      );
      overallBandScore =
        Math.round((sum / scoredResponses.length) * 10) / 10;
    }
  }

  // 섹션 점수가 있으면 overall score 레코드도 upsert
  if (sectionScores && sectionScores.length > 0 && overallBandScore !== null) {
    const { error: overallError } = await supabase
      .from("scores")
      .upsert(
        {
          session_id: id,
          score_type: "overall",
          section_type: null,
          band_score: overallBandScore,
          score_details: {
            section_scores: sectionScores.map((s) => ({
              section_type: s.section_type,
              band_score: s.band_score,
            })),
            calculated_at: new Date().toISOString(),
          },
        },
        { onConflict: "session_id,score_type,section_type" }
      );

    if (overallError) {
      console.error("Error upserting overall score:", overallError);
      // Non-blocking: continue with finalization even if overall score upsert fails
    }
  }

  // 세션 업데이트: finalized
  const { data: updatedSession, error: updateError } = await supabase
    .from("test_sessions")
    .update({
      scoring_status: "finalized",
      total_score: overallBandScore,
      reviewed_by: validation.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Error finalizing session:", updateError);
    return apiError(updateError.message, 500);
  }

  return apiSuccess(updatedSession);
}
