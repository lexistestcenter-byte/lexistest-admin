import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// GET /api/groups/[id]/members — 그룹 멤버 목록
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
    .from("student_group_members")
    .select("id, user_id, joined_at, users(id, name, email)")
    .eq("group_id", id)
    .is("left_at", null)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching group members:", error);
    return apiError(error.message, 500);
  }

  const members = (data || []).map((m) => {
    const user = m.users as unknown as { id: string; name: string; email: string } | null;
    return {
      membership_id: m.id,
      id: user?.id || m.user_id,
      name: user?.name || null,
      email: user?.email || null,
      joined_at: m.joined_at,
    };
  });

  return apiSuccess({ members });
}

// POST /api/groups/[id]/members — 멤버 추가 (user_ids: string[])
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
    return apiError("Invalid group ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  const { user_ids } = body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return apiError("user_ids array is required", 400);
  }

  for (const userId of user_ids) {
    if (!isValidUUID(userId)) {
      return apiError(`Invalid user ID: ${userId}`, 400);
    }
  }

  // 그룹 존재 확인
  const { data: group, error: groupError } = await supabase
    .from("student_groups")
    .select("id")
    .eq("id", id)
    .single();

  if (groupError || !group) {
    return apiError("Group not found", 404);
  }

  // 멤버 upsert (이전에 탈퇴한 경우 재활성화)
  const memberRecords = user_ids.map((userId: string) => ({
    group_id: id,
    user_id: userId,
    left_at: null,
  }));

  const { data, error } = await supabase
    .from("student_group_members")
    .upsert(memberRecords, { onConflict: "group_id,user_id" })
    .select("id, user_id, joined_at");

  if (error) {
    console.error("Error adding members:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    { added_count: data?.length || 0, members: data || [] },
    201
  );
}
