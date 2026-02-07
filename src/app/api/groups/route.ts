import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

// GET /api/groups — 학생 그룹 목록 (id, name, member_count)
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

  let query = supabase
    .from("student_groups")
    .select("id, name, description, created_at, student_group_members(id)", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching groups:", error);
    return apiError(error.message, 500);
  }

  // member_count 계산 후 raw join 데이터 제거
  const groups = (data || []).map((group) => {
    const { student_group_members, ...rest } = group;
    return {
      ...rest,
      member_count: Array.isArray(student_group_members) ? student_group_members.length : 0,
    };
  });

  return apiSuccess({
    groups,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}

// POST /api/groups — 그룹 생성
export async function POST(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  if (!body.name) {
    return apiError("name is required", 400);
  }

  if (containsSqlInjection(body.name)) {
    return apiError("Invalid name", 400);
  }

  if (body.description && containsSqlInjection(body.description)) {
    return apiError("Invalid description", 400);
  }

  const groupData = {
    name: sanitizeHtml(body.name),
    description: body.description ? sanitizeHtml(body.description) : null,
  };

  const { data, error } = await supabase
    .from("student_groups")
    .insert(groupData)
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}
