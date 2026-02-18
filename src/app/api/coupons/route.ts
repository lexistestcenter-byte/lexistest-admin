import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { containsSqlInjection } from "@/lib/utils/sanitize";

// GET: 이용권(결제) 목록 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (search && containsSqlInjection(search)) {
    return apiError("Invalid search query", 400);
  }

  let query = supabase
    .from("coupons")
    .select(
      "*, user:users!coupons_user_id_fkey(id, name, email), package:packages!coupons_package_id_fkey(id, title, unique_code)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    // 주문번호로 직접 검색
    // 사용자명/이메일 검색은 먼저 users 테이블에서 ID를 찾아서 필터
    const { data: matchingUsers } = await supabase
      .from("users")
      .select("id")
      .or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const userIds = matchingUsers?.map((u) => u.id) || [];

    if (userIds.length > 0) {
      query = query.or(
        `wp_order_id.ilike.%${search}%,user_id.in.(${userIds.join(",")})`
      );
    } else {
      query = query.ilike("wp_order_id", `%${search}%`);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching coupons:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    coupons: data || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}
