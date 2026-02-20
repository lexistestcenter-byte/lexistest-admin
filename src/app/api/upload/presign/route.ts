import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";

// 허용된 파일 타입
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/webm"];

// 허용된 파일 확장자
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg"];

// 파일 크기 제한
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

// Presigned URL 유효시간 (초)
const PRESIGN_EXPIRES_IN = 300; // 5분

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

    const body = await request.json();
    const { fileName, fileType, fileSize, type, context } = body;

    // 필수 필드 검증
    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }
    if (!fileType || typeof fileType !== "string") {
      return NextResponse.json({ error: "fileType is required" }, { status: 400 });
    }
    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      return NextResponse.json({ error: "fileSize is required" }, { status: 400 });
    }
    if (!type || !["image", "audio"].includes(type)) {
      return NextResponse.json({ error: "유효하지 않은 파일 타입입니다." }, { status: 400 });
    }

    // context 검증 (Path Traversal 방어)
    if (context && (typeof context !== "string" || context.includes("..") || !/^[a-zA-Z0-9_\-\/]+$/.test(context))) {
      return NextResponse.json({ error: "유효하지 않은 context입니다." }, { status: 400 });
    }

    // 파일 확장자 화이트리스트 검증
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = type === "image" ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_AUDIO_EXTENSIONS;
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 확장자입니다. (${allowedExtensions.join(", ")})` },
        { status: 400 }
      );
    }

    // 파일 MIME 타입 검증
    const allowedTypes = type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 형식입니다. (${allowedTypes.join(", ")})` },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
    if (fileSize > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024;
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)` },
        { status: 400 }
      );
    }

    // 파일 경로 생성: {type}/{context}/{uuid}_{YYYYMMDD}.{ext}
    const fileExt = ext || (type === "image" ? "jpg" : "mp3");
    const uuid = crypto.randomUUID();
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    let filePath: string;
    if (context) {
      filePath = `${type}/${context}/${uuid}_${dateStr}.${fileExt}`;
    } else {
      filePath = `${type}/${uuid}_${dateStr}.${fileExt}`;
    }

    // Presigned URL 생성
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });

    return NextResponse.json({
      uploadUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Presigned URL 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
