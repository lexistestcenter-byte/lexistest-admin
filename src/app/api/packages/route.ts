import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";
import { rateLimit } from "@/lib/utils/rate-limit";

const createPackageLimiter = rateLimit({ interval: 60000, uniqueTokenPerInterval: 500, limit: 20 });

const EXAM_TYPES = ["full", "section", "practice", "free"] as const;
const ACCESS_TYPES = ["public", "groups", "individuals", "groups_and_individuals"] as const;

// GET: 패키지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examType = searchParams.get("exam_type");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // SQL Injection 체크
    if (search && containsSqlInjection(search)) {
      return NextResponse.json(
        { error: "Invalid search query" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("packages")
      .select("*, package_sections(id)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (examType) {
      query = query.eq("exam_type", examType);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching packages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // section_count를 추가하고 package_sections raw 데이터 제거
    const packages = (data || []).map((pkg) => {
      const { package_sections, ...rest } = pkg;
      return {
        ...rest,
        section_count: Array.isArray(package_sections) ? package_sections.length : 0,
      };
    });

    return NextResponse.json({
      packages,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + (data?.length || 0),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 패키지 생성
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
    const { success: rateLimitOk } = await createPackageLimiter.check(ip);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 필수 필드 검증
    if (!body.title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // exam_type 검증
    if (body.exam_type && !EXAM_TYPES.includes(body.exam_type)) {
      return NextResponse.json(
        { error: `Invalid exam_type. Must be one of: ${EXAM_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // access_type 검증
    if (body.access_type && !ACCESS_TYPES.includes(body.access_type)) {
      return NextResponse.json(
        { error: `Invalid access_type. Must be one of: ${ACCESS_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // SQL Injection 체크
    const textFields = ["title", "description", "instruction_title", "instruction_content"];
    for (const field of textFields) {
      if (body[field] && containsSqlInjection(body[field])) {
        return NextResponse.json(
          { error: `Invalid ${field}` },
          { status: 400 }
        );
      }
    }

    // Sanitize & build insert data
    const packageData = {
      title: sanitizeHtml(body.title),
      description: body.description ? sanitizeHtml(body.description) : null,
      image_url: body.image_url || null,
      exam_type: body.exam_type || "full",
      time_limit_minutes: body.time_limit_minutes || null,
      access_type: body.access_type || "public",
      display_order: body.display_order || 0,
      tags: body.tags || null,
      instruction_title: body.instruction_title ? sanitizeHtml(body.instruction_title) : null,
      instruction_content: body.instruction_content ? sanitizeHtml(body.instruction_content) : null,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("packages")
      .insert(packageData)
      .select()
      .single();

    if (error) {
      console.error("Error creating package:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 섹션 연결이 있으면 package_sections에도 추가
    if (body.section_ids && Array.isArray(body.section_ids) && body.section_ids.length > 0) {
      const packageSections = body.section_ids.map((sectionId: string, index: number) => ({
        package_id: data.id,
        section_id: sectionId,
        display_order: index,
      }));

      const { error: sectionsError } = await supabase
        .from("package_sections")
        .insert(packageSections);

      if (sectionsError) {
        console.error("Error linking sections:", sectionsError);
        // 패키지는 이미 생성됨 - 섹션 연결 실패를 경고로 반환
        return NextResponse.json(
          { ...data, warning: "Package created but section linking failed: " + sectionsError.message },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
