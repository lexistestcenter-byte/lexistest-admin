import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";

// 내 프로필 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("id", validation.userId)
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// 내 프로필 수정
export async function PATCH(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return apiError("Name required");
  }

  const { error } = await supabase
    .from("admins")
    .update({ name: name.trim() })
    .eq("id", validation.userId);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
}
