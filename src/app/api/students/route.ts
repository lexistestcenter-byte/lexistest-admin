import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { containsSqlInjection } from "@/lib/utils/sanitize";

// GET /api/students — 학생 목록 (상세 정보 + 그룹 + 패키지 접근권한 수)
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (search && containsSqlInjection(search)) {
    return apiError("Invalid search query", 400);
  }

  // 학생 기본 정보 + 소속 그룹 + 패키지 접근권한 수 조회
  let query = supabase
    .from("users")
    .select(`
      id, name, email, phone, target_score, avatar_url,
      created_at, last_login_at,
      student_group_members(
        id,
        group_id,
        left_at,
        student_groups(id, name)
      ),
      user_package_access(id)
    `, { count: "exact" })
    .is("admin_role", null) // 학생만 (관리자 제외)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching students:", error);
    return apiError(error.message, 500);
  }

  // 데이터 정리: 그룹 목록 및 패키지 접근권한 수 계산
  const students = (data || []).map((user) => {
    const { student_group_members, user_package_access, ...rest } = user;

    const memberships = student_group_members || [];
    const groups = memberships
      .filter((m) => m.student_groups && m.left_at === null)
      .map((m) => ({
        id: (m.student_groups as unknown as { id: string; name: string }).id,
        name: (m.student_groups as unknown as { id: string; name: string }).name,
      }));

    return {
      ...rest,
      groups,
      package_access_count: Array.isArray(user_package_access) ? user_package_access.length : 0,
    };
  });

  return apiSuccess({
    students,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}
