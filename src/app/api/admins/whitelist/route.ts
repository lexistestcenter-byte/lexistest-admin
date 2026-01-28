import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";

// 화이트리스트 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  // super_admin 권한 확인
  const { data: currentAdmin } = await supabase
    .from("admins")
    .select("role")
    .eq("id", validation.userId)
    .single();

  if (currentAdmin?.role !== "super_admin") {
    return apiError("Permission denied", 403);
  }

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}

// 화이트리스트 추가
export async function POST(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  // super_admin 권한 확인
  const { data: currentAdmin } = await supabase
    .from("admins")
    .select("role")
    .eq("id", validation.userId)
    .single();

  if (currentAdmin?.role !== "super_admin") {
    return apiError("Permission denied", 403);
  }

  const body = await request.json();
  const { email, name, role } = body;

  if (!email) {
    return apiError("Email required");
  }

  const { error } = await supabase.from("admin_whitelist").insert({
    email: email.trim().toLowerCase(),
    name: name?.trim() || null,
    role: role || "editor",
  });

  if (error) {
    if (error.code === "23505") {
      return apiError("Email already exists", 409);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true }, 201);
}

// 화이트리스트 삭제
export async function DELETE(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();

  // super_admin 권한 확인
  const { data: currentAdmin } = await supabase
    .from("admins")
    .select("role")
    .eq("id", validation.userId)
    .single();

  if (currentAdmin?.role !== "super_admin") {
    return apiError("Permission denied", 403);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return apiError("ID required");
  }

  const { error } = await supabase
    .from("admin_whitelist")
    .delete()
    .eq("id", id);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
}
