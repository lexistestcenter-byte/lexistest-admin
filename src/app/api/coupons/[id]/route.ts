import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import {
  sanitizeText,
  containsSqlInjection,
  isValidUUID,
} from "@/lib/utils/sanitize";

// GET: 쿠폰 상세 조회 (사용 이력 포함)
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
    .select("*")
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

// PUT: 쿠폰 수정
export async function PUT(
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
  if (body.package_ids !== undefined && !Array.isArray(body.package_ids)) {
    return apiError("package_ids must be an array", 400);
  }

  const updateData: Record<string, unknown> = {};

  if (body.code !== undefined)
    updateData.code = sanitizeText(body.code).toUpperCase();
  if (body.name !== undefined) updateData.name = sanitizeText(body.name);
  if (body.description !== undefined)
    updateData.description = body.description
      ? sanitizeText(body.description)
      : null;
  if (body.package_ids !== undefined) updateData.package_ids = body.package_ids;
  if (body.usage_limit !== undefined)
    updateData.usage_limit = body.usage_limit;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  const { data, error } = await supabase
    .from("coupons")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating coupon:", error);
    if (error.code === "PGRST116") {
      return apiError("Coupon not found", 404);
    }
    if (error.code === "23505") {
      return apiError("Coupon code already exists", 409);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// DELETE: 쿠폰 비활성화 (소프트 삭제)
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
    return apiError("Invalid coupon ID format", 400);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("coupons")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error deactivating coupon:", error);
    if (error.code === "PGRST116") {
      return apiError("Coupon not found", 404);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Coupon deactivated" });
}
