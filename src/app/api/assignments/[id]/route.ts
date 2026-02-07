import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID, containsSqlInjection, sanitizeHtml } from "@/lib/utils/sanitize";

// GET /api/assignments/[id] — 할당 상세 조회
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
    return apiError("Invalid assignment ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase.rpc("get_package_assignment", {
    p_assignment_id: id,
  });

  if (error) {
    console.error("Error fetching assignment:", error);
    if (error.message.includes("not found")) {
      return apiError("Assignment not found", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// PUT /api/assignments/[id] — 할당 수정
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
    return apiError("Invalid assignment ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  // 수정 가능한 필드 확인
  const hasUpdates =
    body.scheduled_start !== undefined ||
    body.scheduled_end !== undefined ||
    body.is_active !== undefined ||
    body.memo !== undefined;

  if (!hasUpdates) {
    return apiError("No fields to update", 400);
  }

  // 날짜 유효성 검증
  if (body.scheduled_start !== undefined && body.scheduled_end !== undefined) {
    const start = new Date(body.scheduled_start);
    const end = new Date(body.scheduled_end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return apiError("Invalid date format", 400);
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
    p_assignment_id: id,
  };
  if (body.scheduled_start !== undefined)
    rpcParams.p_scheduled_start = body.scheduled_start;
  if (body.scheduled_end !== undefined)
    rpcParams.p_scheduled_end = body.scheduled_end;
  if (body.is_active !== undefined)
    rpcParams.p_is_active = body.is_active;
  if (body.memo !== undefined)
    rpcParams.p_memo = body.memo ? sanitizeHtml(body.memo) : body.memo;

  const { data, error } = await supabase.rpc(
    "update_package_assignment",
    rpcParams
  );

  if (error) {
    console.error("Error updating assignment:", error);
    if (error.message.includes("not found")) {
      return apiError("Assignment not found", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// DELETE /api/assignments/[id] — 할당 soft delete (is_active = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return apiError("Invalid assignment ID format", 400);
  }

  const supabase = await getSupabase();

  // Soft delete: is_active = false 로 변경
  const { data, error } = await supabase.rpc("update_package_assignment", {
    p_assignment_id: id,
    p_is_active: false,
  });

  if (error) {
    console.error("Error deactivating assignment:", error);
    if (error.message.includes("not found")) {
      return apiError("Assignment not found", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Assignment deactivated" });
}
