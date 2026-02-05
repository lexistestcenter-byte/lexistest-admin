"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Music, Loader2 } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { toast } from "sonner";
import { getCdnUrl } from "@/lib/cdn";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept: "image" | "audio";
  /** 업로드 경로 컨텍스트 (예: "questions/Q-L-0001", "sections/SEC-001") */
  context?: string;
  /**
   * true면 파일 선택 시 즉시 업로드하지 않고 로컬 미리보기만 표시.
   * onFileReady 콜백으로 File 객체를 부모에게 전달.
   * 부모가 저장 후 uploadFile() 헬퍼로 직접 업로드.
   */
  deferred?: boolean;
  /** deferred 모드에서 파일 선택/제거 시 File 객체 전달 */
  onFileReady?: (file: File | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 파일을 R2에 업로드하는 헬퍼 함수.
 * deferred 모드에서 부모 컴포넌트가 저장 후 호출.
 */
export async function uploadFile(
  file: File,
  type: "image" | "audio",
  context?: string
): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  if (context) {
    formData.append("context", context);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "업로드 실패");
  }

  return response.json();
}

export function FileUpload({
  value,
  onChange,
  accept,
  context,
  deferred = false,
  onFileReady,
  className,
  placeholder,
  disabled,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptMime = accept === "image" ? "image/*" : "audio/*";
  const Icon = accept === "image" ? ImageIcon : Music;

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // 파일 타입 검증
    if (accept === "image" && !file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (accept === "audio" && !file.type.startsWith("audio/")) {
      toast.error("오디오 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 검증 (이미지: 10MB, 오디오: 50MB)
    const maxSize = accept === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`파일 크기가 너무 큽니다. (최대 ${accept === "image" ? "10MB" : "50MB"})`);
      return;
    }

    // deferred 모드: 업로드 안 하고 로컬 미리보기만
    if (deferred) {
      const blobUrl = URL.createObjectURL(file);
      onChange(blobUrl);
      onFileReady?.(file);
      return;
    }

    // 즉시 업로드 모드
    setIsUploading(true);
    try {
      const data = await uploadFile(file, accept, context);
      onChange(data.path);
      toast.success("파일이 업로드되었습니다.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "파일 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }, [accept, context, deferred, onChange, onFileReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    onChange("");
    if (deferred) {
      onFileReady?.(null);
    }
  }, [deferred, onChange, onFileReady]);

  // 표시용 URL (서브패스 → CDN 풀 URL, blob/http → 그대로)
  const displayUrl = getCdnUrl(value);

  // 파일이 있는 경우 미리보기 표시
  if (value) {
    return (
      <div className={cn("relative", className)}>
        {accept === "image" ? (
          <div className="relative border rounded-lg overflow-hidden bg-slate-50">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
                toast.error("이미지를 불러올 수 없습니다.");
              }}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AudioPlayer src={displayUrl} />
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRemove}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 truncate">{value}</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptMime}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
        />
      </div>
    );
  }

  // 파일이 없는 경우 업로드 영역 표시
  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDrop={!disabled ? handleDrop : undefined}
      onDragOver={!disabled ? handleDragOver : undefined}
      onDragLeave={!disabled ? handleDragLeave : undefined}
    >
      {isUploading ? (
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">업로드 중...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4">
          <Icon className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            {placeholder || `${accept === "image" ? "이미지" : "오디오"} 파일을 드래그하거나`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="h-4 w-4 mr-2" />
            파일 선택
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {accept === "image" ? "PNG, JPG, GIF, WebP (최대 10MB)" : "MP3, WAV, M4A (최대 50MB)"}
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMime}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
}
