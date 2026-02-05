import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";

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
    const context = formData.get("context") as string | null; // optional: "questions/Q-L-0001" or "sections/SEC-001"

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

    // 파일 경로 생성
    const ext = file.name.split(".").pop() || (type === "image" ? "jpg" : "mp3");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    let filePath: string;
    if (context) {
      // context가 있으면: audio/questions/Q-L-0001/1706123456-abc123.mp3
      filePath = `${type}/${context}/${timestamp}-${random}.${ext}`;
    } else {
      // context 없으면: audio/1706123456-abc123.mp3
      filePath = `${type}/${timestamp}-${random}.${ext}`;
    }

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // R2에 업로드
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // 서브패스만 반환 (도메인은 클라이언트에서 환경변수로 조합)
    return NextResponse.json({
      success: true,
      path: filePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 파일 삭제
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

    // R2에서 삭제
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: path,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
