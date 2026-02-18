import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml, containsSqlInjection } from "@/lib/utils/sanitize";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXAM_TYPES = ["full", "section", "practice", "free"] as const;
const ACCESS_TYPES = ["public", "groups", "individuals", "groups_and_individuals"] as const;

// GET: 패키지 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid package ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("packages")
      .select("*, package_sections(id, section_id, display_order, custom_time_limit_minutes, sections(id, title, section_type, difficulty, is_practice, time_limit_minutes)), package_bundles(id, child_package_id, display_order, child_package:packages!package_bundles_child_package_id_fkey(id, title, exam_type, is_practice, is_bundle))")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching package:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Package not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: 패키지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid package ID format" },
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

    // 업데이트할 필드만 포함
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = sanitizeHtml(body.title);
    if (body.description !== undefined)
      updateData.description = body.description
        ? sanitizeHtml(body.description)
        : null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.exam_type !== undefined) updateData.exam_type = body.exam_type;
    if (body.time_limit_minutes !== undefined)
      updateData.time_limit_minutes = body.time_limit_minutes;
    if (body.access_type !== undefined) updateData.access_type = body.access_type;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.instruction_title !== undefined)
      updateData.instruction_title = body.instruction_title
        ? sanitizeHtml(body.instruction_title)
        : null;
    if (body.instruction_content !== undefined)
      updateData.instruction_content = body.instruction_content
        ? sanitizeHtml(body.instruction_content)
        : null;
    if (body.is_bundle !== undefined) updateData.is_bundle = body.is_bundle;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;
    if (body.is_free !== undefined) updateData.is_free = body.is_free;
    if (body.is_practice !== undefined) updateData.is_practice = body.is_practice;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;

    if (Object.keys(updateData).length === 0 && !body.section_ids && !body.child_package_ids) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // 패키지 기본 정보 업데이트
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from("packages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating package:", error);
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Package not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 번들 연결 업데이트 (전체 교체)
      if (body.child_package_ids && Array.isArray(body.child_package_ids)) {
        await supabase
          .from("package_bundles")
          .delete()
          .eq("bundle_id", id);

        if (body.child_package_ids.length > 0) {
          const bundleItems = body.child_package_ids.map((childId: string, index: number) => ({
            bundle_id: id,
            child_package_id: childId,
            display_order: index,
          }));

          const { error: bundleError } = await supabase
            .from("package_bundles")
            .insert(bundleItems);

          if (bundleError) {
            console.error("Error updating bundle children:", bundleError);
            return NextResponse.json(
              { ...data, warning: "Package updated but bundle linking failed: " + bundleError.message },
              { status: 200 }
            );
          }
        }
      }

      // 섹션 연결 업데이트 (전체 교체)
      if (body.section_ids && Array.isArray(body.section_ids)) {
        await supabase
          .from("package_sections")
          .delete()
          .eq("package_id", id);

        if (body.section_ids.length > 0) {
          const packageSections = body.section_ids.map((sectionId: string, index: number) => ({
            package_id: id,
            section_id: sectionId,
            display_order: index,
          }));

          const { error: sectionsError } = await supabase
            .from("package_sections")
            .insert(packageSections);

          if (sectionsError) {
            console.error("Error updating sections:", sectionsError);
            return NextResponse.json(
              { ...data, warning: "Package updated but section linking failed: " + sectionsError.message },
              { status: 200 }
            );
          }
        }
      }

      return NextResponse.json(data);
    }

    // section_ids만 업데이트하는 경우
    if (body.section_ids && Array.isArray(body.section_ids)) {
      await supabase
        .from("package_sections")
        .delete()
        .eq("package_id", id);

      if (body.section_ids.length > 0) {
        const packageSections = body.section_ids.map((sectionId: string, index: number) => ({
          package_id: id,
          section_id: sectionId,
          display_order: index,
        }));

        const { error: sectionsError } = await supabase
          .from("package_sections")
          .insert(packageSections);

        if (sectionsError) {
          console.error("Error updating sections:", sectionsError);
          return NextResponse.json({ error: sectionsError.message }, { status: 500 });
        }
      }

      const { data: updatedPkg } = await supabase
        .from("packages")
        .select("*")
        .eq("id", id)
        .single();

      return NextResponse.json(updatedPkg);
    }

    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 패키지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid package ID format" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("packages").delete().eq("id", id);

    if (error) {
      console.error("Error deleting package:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Package deleted" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
