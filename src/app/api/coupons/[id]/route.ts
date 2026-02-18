import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

const VALID_STATUSES = ["paid", "expired", "refunded"] as const;

// GET: 이용권 상세 조회
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
    return apiError("Invalid coupon ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("coupons")
    .select(
      "*, user:users!coupons_user_id_fkey(id, name, email), package:packages!coupons_package_id_fkey(id, title, unique_code)"
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching coupon:", error);
    if (error.code === "PGRST116") {
      return apiError("Coupon not found", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// PATCH: 이용권 상태 변경 (환불 처리 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return apiError("Invalid coupon ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return apiError(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      400
    );
  }

  // 현재 상태 확인
  const { data: current, error: fetchError } = await supabase
    .from("coupons")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return apiError("Coupon not found", 404);
    }
    return apiError(fetchError.message, 500);
  }

  // 환불 처리: paid → refunded만 허용
  if (body.status === "refunded" && current?.status !== "paid") {
    return apiError("Only paid coupons can be refunded", 400);
  }

  const { data, error } = await supabase
    .from("coupons")
    .update({ status: body.status })
    .eq("id", id)
    .select(
      "*, user:users!coupons_user_id_fkey(id, name, email), package:packages!coupons_package_id_fkey(id, title, unique_code)"
    )
    .single();

  if (error) {
    console.error("Error updating coupon status:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}
