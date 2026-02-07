import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// GET: 학생의 소속 그룹 목록
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
    .from("student_group_members")
    .select("id, group_id, joined_at, student_groups(id, name)")
    .eq("user_id", id)
    .is("left_at", null)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error fetching student groups:", error);
    return apiError(error.message, 500);
  }

  const groups = (data || []).map((m) => {
    const group = m.student_groups as unknown as { id: string; name: string } | null;
    return {
      membership_id: m.id,
      group_id: m.group_id,
      joined_at: m.joined_at,
      name: group?.name || null,
    };
  });

  return apiSuccess({ groups });
}

// POST: 학생을 그룹에 추가 (group_ids: string[])
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

  const { group_ids } = body;

  if (!group_ids || !Array.isArray(group_ids) || group_ids.length === 0) {
    return apiError("group_ids array is required", 400);
  }

  for (const groupId of group_ids) {
    if (!isValidUUID(groupId)) {
      return apiError(`Invalid group ID: ${groupId}`, 400);
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

  // 그룹 멤버십 upsert (이미 존재하면 left_at을 null로 업데이트해서 재활성화)
  const memberRecords = group_ids.map((groupId: string) => ({
    group_id: groupId,
    user_id: id,
    left_at: null,
  }));

  const { data, error } = await supabase
    .from("student_group_members")
    .upsert(memberRecords, { onConflict: "group_id,user_id" })
    .select("id, group_id, joined_at");

  if (error) {
    console.error("Error adding student to groups:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    { added_count: data?.length || 0, memberships: data || [] },
    201
  );
}
