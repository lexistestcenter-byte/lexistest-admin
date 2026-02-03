import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 허용된 파일 타입
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/webm"];

// 파일 크기 제한
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "image" or "audio"

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (!type || !["image", "audio"].includes(type)) {
      return NextResponse.json({ error: "유효하지 않은 파일 타입입니다." }, { status: 400 });
    }

    // 파일 타입 검증
    const allowedTypes = type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 형식입니다. (${allowedTypes.join(", ")})` },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024;
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)` },
        { status: 400 }
      );
    }

    // 파일 이름 생성 (타임스탬프 + 원본 확장자)
    const ext = file.name.split(".").pop() || (type === "image" ? "jpg" : "mp3");
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);

      // 버킷이 없는 경우 안내 메시지
      if (uploadError.message.includes("Bucket not found")) {
        return NextResponse.json(
          { error: "스토리지 버킷이 설정되지 않았습니다. Supabase에서 'uploads' 버킷을 생성해주세요." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: uploadError.message || "파일 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 파일 삭제 (선택적)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 체크
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "파일 경로가 없습니다." }, { status: 400 });
    }

    const { error: deleteError } = await supabase.storage
      .from("uploads")
      .remove([path]);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "파일 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
