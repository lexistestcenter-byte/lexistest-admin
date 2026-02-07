import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { sanitizeText, containsSqlInjection } from "@/lib/utils/sanitize";
import { rateLimit } from "@/lib/utils/rate-limit";

const createCouponLimiter = rateLimit({
  interval: 60000,
  uniqueTokenPerInterval: 500,
  limit: 20,
});

// GET: 쿠폰 목록 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get("search");
  const isActive = searchParams.get("is_active");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (search && containsSqlInjection(search)) {
    return apiError("Invalid search query", 400);
  }

  let query = supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (isActive !== null && isActive !== undefined) {
    query = query.eq("is_active", isActive === "true");
  }

  if (search) {
    query = query.or(
      `code.ilike.%${search}%,name.ilike.%${search}%`
    );
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

// POST: 쿠폰 생성
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "anonymous";
  const { success: rateLimitOk } = await createCouponLimiter.check(ip);
  if (!rateLimitOk) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  // 필수 필드 검증
  if (!body.code || !body.name) {
    return apiError("code and name are required", 400);
  }

  // SQL Injection 체크
  const textFields = ["code", "name", "description"];
  for (const field of textFields) {
    if (body[field] && containsSqlInjection(body[field])) {
      return apiError(`Invalid ${field}`, 400);
    }
  }

  // usage_limit 검증
  if (body.usage_limit !== undefined && body.usage_limit !== null) {
    if (typeof body.usage_limit !== "number" || body.usage_limit < 1) {
      return apiError("usage_limit must be a positive number", 400);
    }
  }

  // package_ids 검증
  if (body.package_ids && !Array.isArray(body.package_ids)) {
    return apiError("package_ids must be an array", 400);
  }

  const couponData = {
    code: sanitizeText(body.code).toUpperCase(),
    name: sanitizeText(body.name),
    description: body.description ? sanitizeText(body.description) : null,
    package_ids: body.package_ids || [],
    usage_limit: body.usage_limit || null,
    is_active: body.is_active !== undefined ? body.is_active : true,
    expires_at: body.expires_at || null,
    created_by: validation.userId,
  };

  const { data, error } = await supabase
    .from("coupons")
    .insert(couponData)
    .select()
    .single();

  if (error) {
    console.error("Error creating coupon:", error);
    if (error.code === "23505") {
      return apiError("Coupon code already exists", 409);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}
