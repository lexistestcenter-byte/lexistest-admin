import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";

// 관리자 목록 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// 관리자 정보 수정 (역할, 활성 상태)
export async function PATCH(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  // super_admin 권한 확인
  const { data: currentAdmin } = await supabase
    .from("admins")
    .select("role")
    .eq("id", validation.userId)
    .single();

  if (currentAdmin?.role !== "super_admin") {
    return apiError("Permission denied", 403);
  }

  const body = await request.json();
  const { adminId, role, is_active } = body;

  if (!adminId) {
    return apiError("Admin ID required");
  }

  // 본인 수정 방지
  if (adminId === validation.userId) {
    return apiError("Cannot modify your own account");
  }

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { error } = await supabase
    .from("admins")
    .update(updateData)
    .eq("id", adminId);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
}
