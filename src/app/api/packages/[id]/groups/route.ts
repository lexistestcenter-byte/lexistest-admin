import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// GET: 패키지에 배정된 그룹 목록
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
    .from("package_group_access")
    .select("id, group_id, available_from, available_until, created_at, student_groups(id, name)")
    .eq("package_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching package groups:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ groups: data || [] });
}

// POST: 패키지에 그룹 배정 (group_ids, available_from, available_until)
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

  const { group_ids, available_from, available_until } = body;

  // 검증
  if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
    return apiError("group_ids array is required", 400);
  }

  for (const groupId of group_ids) {
    if (!isValidUUID(groupId)) {
      return apiError(`Invalid group ID: ${groupId}`, 400);
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

  // 그룹 접근권한 upsert
  const accessRecords = group_ids.map((groupId: string) => ({
    package_id: id,
    group_id: groupId,
    available_from: available_from || null,
    available_until: available_until || null,
    granted_by: validation.userId,
  }));

  const { data, error } = await supabase
    .from("package_group_access")
    .upsert(accessRecords, { onConflict: "package_id,group_id" })
    .select("id, group_id, available_from, available_until, created_at");

  if (error) {
    console.error("Error assigning groups:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    {
      assigned_count: data?.length || 0,
      groups: data || [],
    },
    201
  );
}

// DELETE: 패키지에서 그룹 배정 해제
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
  const groupId = searchParams.get("group_id");

  if (!groupId || !isValidUUID(groupId)) {
    return apiError("Valid group_id query parameter is required", 400);
  }

  const { error } = await supabase
    .from("package_group_access")
    .delete()
    .eq("package_id", id)
    .eq("group_id", groupId);

  if (error) {
    console.error("Error removing group assignment:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Group assignment removed" });
}
