import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// GET: 패키지에 배정된 개별 사용자 목록
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
    return apiError("Invalid package ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("user_package_access")
    .select("id, user_id, access_type, available_from, available_until, expires_at, created_at, users(id, name, email)")
    .eq("package_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching package users:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ users: data || [] });
}

// POST: 패키지에 개별 사용자 배정 (user_ids, available_from, available_until)
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
    return apiError("Invalid package ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  const { user_ids, available_from, available_until } = body;

  // 검증
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return apiError("user_ids array is required", 400);
  }

  for (const userId of user_ids) {
    if (!isValidUUID(userId)) {
      return apiError(`Invalid user ID: ${userId}`, 400);
    }
  }

  // 기간 검증
  if (available_from && available_until) {
    if (new Date(available_from) >= new Date(available_until)) {
      return apiError("available_from must be before available_until", 400);
    }
  }

  // 패키지 존재 확인
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id")
    .eq("id", id)
    .single();

  if (pkgError || !pkg) {
    return apiError("Package not found", 404);
  }

  // 사용자 접근권한 upsert
  const accessRecords = user_ids.map((userId: string) => ({
    user_id: userId,
    package_id: id,
    access_type: "assigned" as const,
    available_from: available_from || null,
    available_until: available_until || null,
    granted_by: validation.userId,
  }));

  const { data, error } = await supabase
    .from("user_package_access")
    .upsert(accessRecords, { onConflict: "user_id,package_id" })
    .select("id, user_id, access_type, available_from, available_until, created_at");

  if (error) {
    console.error("Error assigning users:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    {
      assigned_count: data?.length || 0,
      users: data || [],
    },
    201
  );
}

// DELETE: 패키지에서 사용자 배정 해제
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
    return apiError("Invalid package ID format", 400);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("user_id");

  if (!userId || !isValidUUID(userId)) {
    return apiError("Valid user_id query parameter is required", 400);
  }

  const { error } = await supabase
    .from("user_package_access")
    .delete()
    .eq("package_id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing user assignment:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "User assignment removed" });
}
