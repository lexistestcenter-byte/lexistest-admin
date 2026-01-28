import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 현재 로그인한 관리자 프로필 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // RPC로 관리자 프로필 조회
    const { data, error } = await supabase.rpc("get_my_admin_profile");

    if (error) {
      console.error("get_my_admin_profile error:", error);
      return NextResponse.json(
        { error: "Failed to fetch admin profile" },
        { status: 500 }
      );
    }

    const admin = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({ user, admin });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 마지막 로그인 시간 업데이트
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { error } = await supabase.rpc("update_admin_last_login");

    if (error) {
      console.error("update_admin_last_login error:", error);
      return NextResponse.json(
        { error: "Failed to update last login" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update last login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
