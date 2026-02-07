import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

const VALID_LOG_TYPES = ["auth", "test_activity"] as const;

// GET: 활동 로그 조회 (필터링, 페이지네이션)
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const userId = searchParams.get("user_id");
  const sessionId = searchParams.get("session_id");
  const logType = searchParams.get("log_type");
  const eventType = searchParams.get("event_type");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // UUID 형식 검증
  if (userId && !isValidUUID(userId)) {
    return apiError("Invalid user_id format", 400);
  }
  if (sessionId && !isValidUUID(sessionId)) {
    return apiError("Invalid session_id format", 400);
  }

  // log_type 검증
  if (logType && !VALID_LOG_TYPES.includes(logType as (typeof VALID_LOG_TYPES)[number])) {
    return apiError(
      `Invalid log_type. Must be one of: ${VALID_LOG_TYPES.join(", ")}`,
      400
    );
  }

  // 날짜 형식 검증
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    return apiError("Invalid date_from format", 400);
  }
  if (dateTo && isNaN(Date.parse(dateTo))) {
    return apiError("Invalid date_to format", 400);
  }

  let query = supabase
    .from("activity_logs")
    .select("*, users(name, email)", { count: "exact" })
    .order("timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }
  if (logType) {
    query = query.eq("log_type", logType);
  }
  if (eventType) {
    query = query.eq("event_type", eventType);
  }
  if (dateFrom) {
    query = query.gte("timestamp", dateFrom);
  }
  if (dateTo) {
    query = query.lte("timestamp", dateTo);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching activity logs:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    logs: data || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}
