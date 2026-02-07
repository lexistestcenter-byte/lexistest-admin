import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { containsSqlInjection } from "@/lib/utils/sanitize";

// GET /api/users — 학생 목록 (id, name, email) - 검색 가능
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

  let query = supabase
    .from("users")
    .select("id, name, email, created_at", { count: "exact" })
    .is("admin_role", null) // 학생만 (관리자 제외)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    users: data || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}
