import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// DELETE /api/groups/[id]/members/[userId] — 멤버 제거 (soft delete: left_at 설정)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const { id, userId } = await params;

  if (!isValidUUID(id)) {
    return apiError("Invalid group ID format", 400);
  }
  if (!isValidUUID(userId)) {
    return apiError("Invalid user ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("student_group_members")
    .update({ left_at: new Date().toISOString() })
    .eq("group_id", id)
    .eq("user_id", userId)
    .is("left_at", null)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return apiError("Member not found in this group", 404);
    }
    console.error("Error removing member:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Member removed from group" });
}
