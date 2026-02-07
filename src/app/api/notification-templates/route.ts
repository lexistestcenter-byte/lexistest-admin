import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import {
  sanitizeText,
  sanitizeHtml,
  containsSqlInjection,
  isValidUUID,
} from "@/lib/utils/sanitize";

const VALID_NOTIFICATION_TYPES = ["email", "kakao", "sms"] as const;

// GET: 알림 템플릿 목록 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const notificationType = searchParams.get("notification_type");
  const isActive = searchParams.get("is_active");

  let query = supabase
    .from("notification_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (notificationType) {
    query = query.eq("notification_type", notificationType);
  }
  if (isActive !== null && isActive !== undefined) {
    query = query.eq("is_active", isActive === "true");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notification templates:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data || []);
}

// PUT: 알림 템플릿 수정
export async function PUT(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const body = await request.json();

  if (!body.id) {
    return apiError("Template id is required", 400);
  }
  if (!isValidUUID(body.id)) {
    return apiError("Invalid template id format", 400);
  }

  // SQL injection 체크
  const textFields = ["name", "code", "subject_template", "body_template"];
  for (const field of textFields) {
    if (body[field] && containsSqlInjection(body[field])) {
      return apiError(`Invalid ${field}`, 400);
    }
  }

  if (body.notification_type && !VALID_NOTIFICATION_TYPES.includes(body.notification_type)) {
    return apiError(
      `Invalid notification_type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(", ")}`,
      400
    );
  }

  const updateData: Record<string, unknown> = {};

  if (body.notification_type !== undefined)
    updateData.notification_type = body.notification_type;
  if (body.code !== undefined) updateData.code = sanitizeText(body.code);
  if (body.name !== undefined) updateData.name = sanitizeText(body.name);
  if (body.subject_template !== undefined)
    updateData.subject_template = body.subject_template
      ? sanitizeText(body.subject_template)
      : null;
  if (body.body_template !== undefined)
    updateData.body_template = sanitizeHtml(body.body_template);
  if (body.variables !== undefined) updateData.variables = body.variables;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  if (Object.keys(updateData).length === 0) {
    return apiError("No fields to update", 400);
  }

  const { data, error } = await supabase
    .from("notification_templates")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating notification template:", error);
    if (error.code === "PGRST116") {
      return apiError("Template not found", 404);
    }
    if (error.code === "23505") {
      return apiError("Template code already exists", 409);
    }
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}
