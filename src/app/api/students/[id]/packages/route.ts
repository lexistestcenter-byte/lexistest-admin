import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// GET: 학생의 패키지 접근권한 목록
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
    return apiError("Invalid student ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("user_package_access")
    .select("id, package_id, access_type, available_from, available_until, expires_at, created_at, packages(id, title, exam_type)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching student packages:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ packages: data || [] });
}

// POST: 학생에게 패키지 접근권한 부여 (package_ids, available_from, available_until)
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
    return apiError("Invalid student ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  const { package_ids, available_from, available_until } = body;

  if (!package_ids || !Array.isArray(package_ids) || package_ids.length === 0) {
    return apiError("package_ids array is required", 400);
  }

  for (const packageId of package_ids) {
    if (!isValidUUID(packageId)) {
      return apiError(`Invalid package ID: ${packageId}`, 400);
    }
  }

  // 기간 검증
  if (available_from && available_until) {
    if (new Date(available_from) >= new Date(available_until)) {
      return apiError("available_from must be before available_until", 400);
    }
  }

  // 학생 존재 확인
  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .is("admin_role", null)
    .single();

  if (studentError || !student) {
    return apiError("Student not found", 404);
  }

  // 접근권한 upsert
  const accessRecords = package_ids.map((packageId: string) => ({
    user_id: id,
    package_id: packageId,
    access_type: "assigned" as const,
    available_from: available_from || null,
    available_until: available_until || null,
    granted_by: validation.userId,
  }));

  const { data, error } = await supabase
    .from("user_package_access")
    .upsert(accessRecords, { onConflict: "user_id,package_id" })
    .select("id, package_id, access_type, available_from, available_until, created_at");

  if (error) {
    console.error("Error granting package access:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    { granted_count: data?.length || 0, access: data || [] },
    201
  );
}

// DELETE: 학생의 특정 패키지 접근권한 삭제
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
    return apiError("Invalid student ID format", 400);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;
  const packageId = searchParams.get("package_id");

  if (!packageId || !isValidUUID(packageId)) {
    return apiError("Valid package_id query parameter is required", 400);
  }

  const { error } = await supabase
    .from("user_package_access")
    .delete()
    .eq("user_id", id)
    .eq("package_id", packageId);

  if (error) {
    console.error("Error revoking package access:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Package access revoked" });
}
