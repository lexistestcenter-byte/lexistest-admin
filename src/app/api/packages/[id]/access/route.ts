import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import { isValidUUID } from "@/lib/utils/sanitize";

const VALID_ACCESS_TYPES = ["coupon", "assigned", "trial", "purchase"] as const;

// GET: 패키지에 접근 가능한 사용자 목록
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
    return apiError("Invalid package ID format", 400);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("user_exam_access")
    .select("*, users(name, email)", { count: "exact" })
    .eq("exam_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching package access:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    access: data || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}

// POST: 사용자에게 패키지 접근권한 부여
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
    return apiError("Invalid package ID format", 400);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  if (!body.user_id) {
    return apiError("user_id is required", 400);
  }
  if (!isValidUUID(body.user_id)) {
    return apiError("Invalid user_id format", 400);
  }

  const accessType = body.access_type || "assigned";
  if (!VALID_ACCESS_TYPES.includes(accessType)) {
    return apiError(
      `Invalid access_type. Must be one of: ${VALID_ACCESS_TYPES.join(", ")}`,
      400
    );
  }

  const accessData = {
    user_id: body.user_id,
    exam_id: id,
    access_type: accessType,
    source_id: body.source_id || null,
    granted_by: validation.userId,
    expires_at: body.expires_at || null,
  };

  const { data, error } = await supabase
    .from("user_exam_access")
    .insert(accessData)
    .select()
    .single();

  if (error) {
    console.error("Error granting access:", error);
    if (error.code === "23505") {
      return apiError("User already has access to this package", 409);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}

// DELETE: 사용자의 패키지 접근권한 삭제
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
    return apiError("Invalid package ID format", 400);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("user_id");

  if (!userId) {
    return apiError("user_id query parameter is required", 400);
  }
  if (!isValidUUID(userId)) {
    return apiError("Invalid user_id format", 400);
  }

  const { error } = await supabase
    .from("user_exam_access")
    .delete()
    .eq("exam_id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error revoking access:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, message: "Access revoked" });
}
