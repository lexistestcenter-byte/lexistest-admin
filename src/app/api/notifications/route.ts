import { NextRequest } from "next/server";
import {
  validateApiRequest,
  apiError,
  apiSuccess,
  getSupabase,
} from "@/lib/api/server";
import {
  sanitizeHtml,
  sanitizeText,
  containsSqlInjection,
  isValidUUID,
} from "@/lib/utils/sanitize";
import { rateLimit } from "@/lib/utils/rate-limit";

const sendNotificationLimiter = rateLimit({
  interval: 60000,
  uniqueTokenPerInterval: 500,
  limit: 30,
});

const VALID_NOTIFICATION_TYPES = ["email", "kakao", "sms"] as const;
const VALID_STATUSES = ["pending", "sent", "failed"] as const;

// GET: 알림 목록 조회
export async function GET(request: NextRequest) {
  const validation = await validateApiRequest(request);
  if (!validation.valid) {
    return apiError(validation.error!, 401);
  }

  const supabase = await getSupabase();
  const searchParams = request.nextUrl.searchParams;

  const notificationType = searchParams.get("notification_type");
  const status = searchParams.get("status");
  const userId = searchParams.get("user_id");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("notifications")
    .select("*, users(name, email), notification_templates(name, code)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (notificationType) {
    query = query.eq("notification_type", notificationType);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (userId) {
    if (!isValidUUID(userId)) {
      return apiError("Invalid user_id format", 400);
    }
    query = query.eq("user_id", userId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    notifications: data || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + (data?.length || 0),
    },
  });
}

// POST: 알림 발송
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "anonymous";
  const { success: rateLimitOk } = await sendNotificationLimiter.check(ip);
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
  if (!body.user_ids || !Array.isArray(body.user_ids) || body.user_ids.length === 0) {
    return apiError("user_ids (array) is required", 400);
  }

  if (!body.notification_type) {
    return apiError("notification_type is required", 400);
  }
  if (!VALID_NOTIFICATION_TYPES.includes(body.notification_type)) {
    return apiError(
      `Invalid notification_type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(", ")}`,
      400
    );
  }

  if (!body.recipient && !body.template_id) {
    return apiError("recipient or template_id is required", 400);
  }

  // SQL injection 체크
  const textFields = ["subject", "content", "recipient"];
  for (const field of textFields) {
    if (body[field] && containsSqlInjection(body[field])) {
      return apiError(`Invalid ${field}`, 400);
    }
  }

  // user_ids UUID 검증
  for (const uid of body.user_ids) {
    if (!isValidUUID(uid)) {
      return apiError(`Invalid user_id format: ${uid}`, 400);
    }
  }

  // 템플릿 사용 시 내용 생성
  let subject = body.subject ? sanitizeText(body.subject) : null;
  let content = body.content ? sanitizeHtml(body.content) : null;

  if (body.template_id) {
    if (!isValidUUID(body.template_id)) {
      return apiError("Invalid template_id format", 400);
    }

    const { data: template, error: templateError } = await supabase
      .from("notification_templates")
      .select("*")
      .eq("id", body.template_id)
      .single();

    if (templateError || !template) {
      return apiError("Template not found", 404);
    }

    // 변수 치환
    const variables = body.variables || {};
    subject =
      subject ||
      (template.subject_template
        ? replaceVariables(template.subject_template, variables)
        : null);
    content =
      content ||
      replaceVariables(template.body_template, variables);
  }

  if (!content) {
    return apiError("content is required (or provide a template_id)", 400);
  }

  // 여러 사용자에게 알림 생성
  const notifications = body.user_ids.map((userId: string) => ({
    user_id: userId,
    template_id: body.template_id || null,
    notification_type: body.notification_type,
    recipient: body.recipient || "",
    subject,
    content,
    status: "pending" as const,
    metadata: body.metadata || null,
  }));

  const { data, error } = await supabase
    .from("notifications")
    .insert(notifications)
    .select();

  if (error) {
    console.error("Error creating notifications:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data, 201);
}

// 템플릿 변수 치환 헬퍼
function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(
      new RegExp(`{{${key}}}`, "g"),
      sanitizeText(String(value))
    );
  }
  return result;
}
