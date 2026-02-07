import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

// GET: 그룹의 패키지 접근권한 목록 (그룹 멤버들의 접근권한 조회)
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

  // 그룹 존재 확인
  const { data: group, error: groupError } = await supabase
    .from("student_groups")
    .select("id, name")
    .eq("id", id)
    .single();

  if (groupError || !group) {
    return apiError("Group not found", 404);
  }

  // 그룹 멤버의 user_id 조회
  const { data: members, error: membersError } = await supabase
    .from("student_group_members")
    .select("user_id")
    .eq("group_id", id)
    .is("left_at", null);

  if (membersError) {
    console.error("Error fetching group members:", membersError);
    return apiError(membersError.message, 500);
  }

  if (!members || members.length === 0) {
    return apiSuccess({ group, packages: [] });
  }

  const memberIds = members.map((m) => m.user_id);

  // 멤버들의 접근권한에서 고유한 exam_id 목록 조회
  const { data: accessData, error: accessError } = await supabase
    .from("user_exam_access")
    .select("exam_id, exams(id, title, exam_type, is_published)")
    .in("user_id", memberIds);

  if (accessError) {
    console.error("Error fetching group package access:", accessError);
    return apiError(accessError.message, 500);
  }

  // 고유 패키지 목록 생성
  const packageMap = new Map<string, unknown>();
  for (const access of accessData || []) {
    if (access.exams && !packageMap.has(access.exam_id)) {
      packageMap.set(access.exam_id, access.exams);
    }
  }

  return apiSuccess({
    group,
    packages: Array.from(packageMap.values()),
  });
}

// POST: 그룹 전체에 패키지 접근권한 부여
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

  if (!body.exam_id) {
    return apiError("exam_id is required", 400);
  }
  if (!isValidUUID(body.exam_id)) {
    return apiError("Invalid exam_id format", 400);
  }

  // 그룹 멤버 조회
  const { data: members, error: membersError } = await supabase
    .from("student_group_members")
    .select("user_id")
    .eq("group_id", id)
    .is("left_at", null);

  if (membersError) {
    console.error("Error fetching group members:", membersError);
    return apiError(membersError.message, 500);
  }

  if (!members || members.length === 0) {
    return apiError("Group has no active members", 400);
  }

  // 각 멤버에게 접근권한 부여 (이미 있으면 무시)
  const accessRecords = members.map((m) => ({
    user_id: m.user_id,
    exam_id: body.exam_id,
    access_type: "assigned" as const,
    granted_by: validation.userId,
    expires_at: body.expires_at || null,
  }));

  const { data, error } = await supabase
    .from("user_exam_access")
    .upsert(accessRecords, { onConflict: "user_id,exam_id" })
    .select();

  if (error) {
    console.error("Error granting group access:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    {
      granted_count: data?.length || 0,
      total_members: members.length,
    },
    201
  );
}

// DELETE: 그룹 전체의 특정 패키지 접근권한 삭제
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
  const searchParams = request.nextUrl.searchParams;
  const examId = searchParams.get("exam_id");

  if (!examId) {
    return apiError("exam_id query parameter is required", 400);
  }
  if (!isValidUUID(examId)) {
    return apiError("Invalid exam_id format", 400);
  }

  // 그룹 멤버 조회
  const { data: members, error: membersError } = await supabase
    .from("student_group_members")
    .select("user_id")
    .eq("group_id", id)
    .is("left_at", null);

  if (membersError) {
    console.error("Error fetching group members:", membersError);
    return apiError(membersError.message, 500);
  }

  if (!members || members.length === 0) {
    return apiSuccess({ success: true, revoked_count: 0 });
  }

  const memberIds = members.map((m) => m.user_id);

  const { error } = await supabase
    .from("user_exam_access")
    .delete()
    .eq("exam_id", examId)
    .in("user_id", memberIds);

  if (error) {
    console.error("Error revoking group access:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    success: true,
    message: "Group access revoked",
    member_count: members.length,
  });
}
