import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: 섹션 내 아이템(문제/그룹) 목록 조회
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

    const { data, error } = await supabase.rpc("get_section_items", {
      p_section_id: sectionId,
    });

    if (error) {
      console.error("Error fetching section items:", error);
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

// POST: 섹션에 문제 또는 그룹 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { item_type, question_id, group_id, question_number_start, display_order } =
      body;

    if (!item_type || !["question", "group"].includes(item_type)) {
      return NextResponse.json(
        { error: "item_type must be 'question' or 'group'" },
        { status: 400 }
      );
    }

    if (question_number_start === undefined || question_number_start === null) {
      return NextResponse.json(
        { error: "question_number_start is required" },
        { status: 400 }
      );
    }

    // 문제 추가
    if (item_type === "question") {
      if (!question_id) {
        return NextResponse.json(
          { error: "question_id is required for item_type 'question'" },
          { status: 400 }
        );
      }

      if (!UUID_REGEX.test(question_id)) {
        return NextResponse.json(
          { error: "Invalid question_id format" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc("add_question_to_section", {
        p_section_id: sectionId,
        p_question_id: question_id,
        p_question_number_start: question_number_start,
        p_display_order: display_order || 0,
      });

      if (error) {
        console.error("Error adding question to section:", error);
        if (error.message.includes("already")) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }

    // 그룹 추가
    if (item_type === "group") {
      if (!group_id) {
        return NextResponse.json(
          { error: "group_id is required for item_type 'group'" },
          { status: 400 }
        );
      }

      if (!UUID_REGEX.test(group_id)) {
        return NextResponse.json(
          { error: "Invalid group_id format" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase.rpc("add_group_to_section", {
        p_section_id: sectionId,
        p_group_id: group_id,
        p_question_number_start: question_number_start,
        p_display_order: display_order || 0,
      });

      if (error) {
        console.error("Error adding group to section:", error);
        if (error.message.includes("already")) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 섹션에서 아이템 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("item_id");

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "item_id query parameter is required" },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(itemId)) {
      return NextResponse.json(
        { error: "Invalid item_id format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("remove_item_from_section", {
      p_item_id: itemId,
    });

    if (error) {
      console.error("Error removing item from section:", error);
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

// PUT: 섹션 아이템 순서 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!UUID_REGEX.test(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID format" },
        { status: 400 }
      );
    }

    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }

    // 각 아이템 검증
    for (const item of items) {
      if (!item.item_id || !UUID_REGEX.test(item.item_id)) {
        return NextResponse.json(
          { error: "Invalid item_id in items array" },
          { status: 400 }
        );
      }
      if (item.question_number_start === undefined) {
        return NextResponse.json(
          { error: "question_number_start is required for each item" },
          { status: 400 }
        );
      }
      if (item.display_order === undefined) {
        return NextResponse.json(
          { error: "display_order is required for each item" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase.rpc("reorder_section_items", {
      p_section_id: sectionId,
      p_items: items,
    });

    if (error) {
      console.error("Error reordering section items:", error);
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
