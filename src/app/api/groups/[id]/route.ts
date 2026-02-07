import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID, sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

// GET /api/groups/[id] — 그룹 상세 조회
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
    return apiError("Invalid group ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("student_groups")
    .select("id, name, description, created_at, updated_at, student_group_members(id)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return apiError("Group not found", 404);
    }
    console.error("Error fetching group:", error);
    return apiError(error.message, 500);
  }

  const { student_group_members, ...rest } = data;
  return apiSuccess({
    ...rest,
    member_count: Array.isArray(student_group_members) ? student_group_members.length : 0,
  });
}

// PUT /api/groups/[id] — 그룹 수정
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
    return apiError("Invalid group ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (!body.name) return apiError("name cannot be empty", 400);
    if (containsSqlInjection(body.name)) return apiError("Invalid name", 400);
    updateData.name = sanitizeHtml(body.name);
  }

  if (body.description !== undefined) {
    if (body.description && containsSqlInjection(body.description)) {
      return apiError("Invalid description", 400);
    }
    updateData.description = body.description ? sanitizeHtml(body.description) : null;
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  const { data, error } = await supabase
    .from("student_groups")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return apiError("Group not found", 404);
    }
    console.error("Error updating group:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// DELETE /api/groups/[id] — 그룹 삭제
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
    return apiError("Invalid group ID format", 400);
  }

  const supabase = await getSupabase();

  const { error } = await supabase
    .from("student_groups")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting group:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Group deleted" });
}
