import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import {
  isValidUUID,
  containsSqlInjection,
  sanitizeHtml,
} from "@/lib/utils/sanitize";

const ASSIGNMENT_TYPES = ["group", "individual"] as const;

// GET /api/assignments — 할당 목록 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  // 필터 파라미터
  const packageId = searchParams.get("package_id");
  const groupId = searchParams.get("group_id");
  const userId = searchParams.get("user_id");
  const isActive = searchParams.get("is_active");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // UUID 형식 검증
  if (packageId && !isValidUUID(packageId)) {
    return apiError("Invalid package_id format", 400);
  }
  if (groupId && !isValidUUID(groupId)) {
    return apiError("Invalid group_id format", 400);
  }
  if (userId && !isValidUUID(userId)) {
    return apiError("Invalid user_id format", 400);
  }

  // RPC 호출
  const rpcParams: Record<string, unknown> = {
    p_limit: limit,
    p_offset: offset,
  };
  if (packageId) rpcParams.p_package_id = packageId;
  if (groupId) rpcParams.p_group_id = groupId;
  if (userId) rpcParams.p_user_id = userId;
  if (isActive !== null && isActive !== undefined && isActive !== "") {
    rpcParams.p_is_active = isActive === "true";
  }

  const { data, error } = await supabase.rpc(
    "get_package_assignments",
    rpcParams
  );

  if (error) {
    console.error("Error fetching assignments:", error);
    return apiError(error.message, 500);
  }

  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  // total_count 필드를 각 행에서 제거
  const assignments = rows.map(
    ({ total_count, ...rest }: Record<string, unknown>) => rest
  );

  return apiSuccess({
    assignments,
    pagination: {
      total,
      limit,
      offset,
      hasMore: total > offset + assignments.length,
    },
  });
}

// POST /api/assignments — 할당 생성
export async function POST(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  // 필수 필드 검증
  if (!body.package_id) {
    return apiError("package_id is required", 400);
  }
  if (!isValidUUID(body.package_id)) {
    return apiError("Invalid package_id format", 400);
  }

  if (!body.assignment_type) {
    return apiError("assignment_type is required", 400);
  }
  if (!ASSIGNMENT_TYPES.includes(body.assignment_type)) {
    return apiError(
      `Invalid assignment_type. Must be one of: ${ASSIGNMENT_TYPES.join(", ")}`,
      400
    );
  }

  // 할당 유형에 따른 필수 필드 검증
  if (body.assignment_type === "group") {
    if (!body.group_id) {
      return apiError("group_id is required for group assignment", 400);
    }
    if (!isValidUUID(body.group_id)) {
      return apiError("Invalid group_id format", 400);
    }
  }

  if (body.assignment_type === "individual") {
    if (!body.user_id) {
      return apiError("user_id is required for individual assignment", 400);
    }
    if (!isValidUUID(body.user_id)) {
      return apiError("Invalid user_id format", 400);
    }
  }

  // 날짜 유효성 검증
  if (body.scheduled_start && body.scheduled_end) {
    const start = new Date(body.scheduled_start);
    const end = new Date(body.scheduled_end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return apiError("Invalid date format for scheduled_start or scheduled_end", 400);
    }
    if (start >= end) {
      return apiError("scheduled_start must be before scheduled_end", 400);
    }
  }

  // 메모 SQL injection 체크
  if (body.memo && containsSqlInjection(body.memo)) {
    return apiError("Invalid memo content", 400);
  }

  // RPC 호출
  const rpcParams: Record<string, unknown> = {
    p_package_id: body.package_id,
    p_assignment_type: body.assignment_type,
  };
  if (body.group_id) rpcParams.p_group_id = body.group_id;
  if (body.user_id) rpcParams.p_user_id = body.user_id;
  if (body.scheduled_start) rpcParams.p_scheduled_start = body.scheduled_start;
  if (body.scheduled_end) rpcParams.p_scheduled_end = body.scheduled_end;
  if (body.memo) rpcParams.p_memo = sanitizeHtml(body.memo);

  const { data, error } = await supabase.rpc(
    "create_package_assignment",
    rpcParams
  );

  if (error) {
    console.error("Error creating assignment:", error);
    // Duplicate constraint errors
    if (error.code === "23505") {
      return apiError("Assignment already exists for this package and target", 409);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}
