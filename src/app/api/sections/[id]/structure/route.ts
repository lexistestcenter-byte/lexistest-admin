import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: 전체 구조 조회 (콘텐츠 블록 + 문제 그룹 + 문제)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("get_section_full_structure", {
      p_section_id: sectionId,
    });

    if (error) {
      console.error("Error fetching section structure:", error);
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
