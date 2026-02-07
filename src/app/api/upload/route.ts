import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { rateLimit } from "@/lib/utils/rate-limit";

const uploadLimiter = rateLimit({ interval: 60000, uniqueTokenPerInterval: 500, limit: 20 });

// 허용된 파일 타입
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/webm"];

// 허용된 파일 확장자
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg"];

// 파일 크기 제한
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
    const { success: rateLimitOk } = await uploadLimiter.check(ip);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

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

    // context 검증 (Path Traversal 방어)
    if (context && !/^[a-zA-Z0-9_-]+$/.test(context)) {
      return NextResponse.json({ error: "유효하지 않은 context입니다." }, { status: 400 });
    }

    // 파일 확장자 화이트리스트 검증
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = type === "image" ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_AUDIO_EXTENSIONS;
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 확장자입니다. (${allowedExtensions.join(", ")})` },
        { status: 400 }
      );
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
    const fileExt = ext || (type === "image" ? "jpg" : "mp3");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    let filePath: string;
    if (context) {
      // context가 있으면: audio/questions/Q-L-0001/1706123456-abc123.mp3
      filePath = `${type}/${context}/${timestamp}-${random}.${fileExt}`;
    } else {
      // context 없으면: audio/1706123456-abc123.mp3
      filePath = `${type}/${timestamp}-${random}.${fileExt}`;
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

    // Path Traversal 방어
    if (path.includes("..")) {
      return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
    }

    // 허용된 프리픽스 검증
    if (!path.startsWith("image/") && !path.startsWith("audio/")) {
      return NextResponse.json({ error: "허용되지 않는 파일 경로입니다." }, { status: 400 });
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
