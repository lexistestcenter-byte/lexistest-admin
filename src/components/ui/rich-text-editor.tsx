"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ImageIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback, useState } from "react";
import { uploadFile } from "./file-upload";
import { toast } from "sonner";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

/**
 * blob URL → File 매핑 (모듈 레벨).
 * blob URL은 전역 고유하므로 여러 에디터 인스턴스에서도 안전.
 * File 객체를 여기 보관하면 GC 되지 않아 저장 시점까지 유효.
 */
const pendingEditorFiles = new Map<string, File>();

/** 상대 경로 img src → CDN 풀 URL로 변환 (에디터 표시용) */
function contentToEditor(html: string): string {
  if (!html || !CDN_URL) return html;
  return html.replace(
    /(<img[^>]*\ssrc=")(?!blob:|http:|https:)([^"]+)(")/g,
    `$1${CDN_URL}/$2$3`
  );
}

/** CDN 풀 URL img src → 상대 경로로 변환 (DB 저장용) */
function contentToStorage(html: string): string {
  if (!html || !CDN_URL) return html;
  const escaped = CDN_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`(src=")${escaped}/`, "g"), "$1");
}

/**
 * 에디터 HTML에서 blob URL 이미지를 R2에 업로드하고 상대 경로로 교체.
 * 저장 시점에 호출. blob URL이 없으면 원본 그대로 반환.
 * pendingEditorFiles Map에서 File 객체를 꺼내 업로드 (GC 방지됨).
 */
export async function uploadEditorImages(
  html: string,
  context?: string
): Promise<string> {
  if (!html) return html;
  const blobUrlRegex = /src="(blob:[^"]+)"/g;
  const matches = [...html.matchAll(blobUrlRegex)];
  if (matches.length === 0) return html;

  let result = html;
  for (const match of matches) {
    const blobUrl = match[1];
    try {
      // 1) Map에서 원본 File 가져오기
      let file = pendingEditorFiles.get(blobUrl);
      console.log("[IMG-DEBUG] uploadEditorImages: blobUrl=", blobUrl.substring(0, 60), "fileInMap=", !!file, "mapSize=", pendingEditorFiles.size);

      // 2) Map에 없으면 blob fetch fallback
      if (!file) {
        const response = await fetch(blobUrl);
        if (!response.ok) continue;
        const blob = await response.blob();
        const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
        file = new File([blob], `editor-image.${ext}`, { type: blob.type });
      }

      const { path } = await uploadFile(file, "image", context);
      const escaped = blobUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "g"), path);

      // 정리
      pendingEditorFiles.delete(blobUrl);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Failed to upload editor image:", e);
      toast.error("이미지 업로드 실패: " + (e instanceof Error ? e.message : String(e)));
    }
  }
  return result;
}

/**
 * blob URL img 태그를 제거 (POST 전 임시 정리용).
 * 아직 업로드되지 않은 이미지를 DB에 저장하지 않기 위해 사용.
 */
export function stripBlobImages(html: string): string {
  if (!html) return html;
  return html.replace(/<img[^>]*\ssrc="blob:[^"]*"[^>]*\/?>/g, "");
}

const HEADING_OPTIONS = [
  { value: "p", label: "본문", cls: "text-sm", px: "16px" },
  { value: "h1", label: "제목 1", cls: "text-2xl font-bold", px: "24px" },
  { value: "h2", label: "제목 2", cls: "text-xl font-bold", px: "20px" },
  { value: "h3", label: "제목 3", cls: "text-lg font-semibold", px: "18px" },
  { value: "h4", label: "제목 4", cls: "text-base font-semibold", px: "16px" },
  { value: "h5", label: "제목 5", cls: "text-sm font-medium", px: "14px" },
  { value: "h6", label: "제목 6", cls: "text-xs font-medium", px: "12px" },
] as const;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [headingOpen, setHeadingOpen] = useState(false);

  const handleImageInsert = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("이미지 크기는 10MB를 초과할 수 없습니다.");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    pendingEditorFiles.set(blobUrl, file);
    console.log("[IMG-DEBUG] handleImageInsert: blobUrl=", blobUrl, "mapSize=", pendingEditorFiles.size, "editorRef=", !!editorRef.current);
    editorRef.current?.chain().focus().setImage({ src: blobUrl }).run();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: contentToEditor(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const raw = editor.getHTML();
      const stored = contentToStorage(raw);
      console.log("[IMG-DEBUG] onUpdate: hasBlob=", raw.includes("blob:"), "content=", stored.substring(0, 200));
      onChange(stored);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2",
          "[&_p]:my-1 [&_strong]:font-bold [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-1 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:my-1 [&_h5]:text-sm [&_h5]:font-medium [&_h5]:my-1 [&_h6]:text-xs [&_h6]:font-medium [&_h6]:my-1",
          "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2"
        ),
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (file?.type.startsWith("image/")) {
          event.preventDefault();
          handleImageInsert(file);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (files?.length) {
          const file = files[0];
          if (file?.type.startsWith("image/")) {
            event.preventDefault();
            handleImageInsert(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setHeadingOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 외부에서 value가 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && value !== contentToStorage(editor.getHTML())) {
      editor.commands.setContent(contentToEditor(value));
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const activeHeading = editor.isActive("heading", { level: 1 }) ? "h1"
    : editor.isActive("heading", { level: 2 }) ? "h2"
    : editor.isActive("heading", { level: 3 }) ? "h3"
    : editor.isActive("heading", { level: 4 }) ? "h4"
    : editor.isActive("heading", { level: 5 }) ? "h5"
    : editor.isActive("heading", { level: 6 }) ? "h6"
    : "p";

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
        {/* 텍스트 크기 드롭다운 */}
        <div className="relative" ref={headingRef}>
          <button
            type="button"
            onClick={() => setHeadingOpen(!headingOpen)}
            className="h-8 pl-2 pr-6 text-xs rounded hover:bg-slate-200 flex items-center relative cursor-pointer"
          >
            {HEADING_OPTIONS.find((o) => o.value === activeHeading)?.label || "본문"}
            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          </button>
          {headingOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg py-1 z-50 min-w-[200px]">
              {HEADING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between",
                    activeHeading === opt.value && "bg-slate-100"
                  )}
                  onClick={() => {
                    if (opt.value === "p") {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      const level = parseInt(opt.value.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
                      editor.chain().focus().toggleHeading({ level }).run();
                    }
                    setHeadingOpen(false);
                  }}
                >
                  <span className={opt.cls}>{opt.label}</span>
                  <span className="text-[10px] text-gray-400 ml-3">{opt.px}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-slate-200"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-slate-200"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-slate-200"
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "left" }) && "bg-slate-200"
          )}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "center" }) && "bg-slate-200"
          )}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "right" }) && "bg-slate-200"
          )}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 p-0"
          title="이미지 삽입"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageInsert(file);
            e.target.value = "";
          }}
        />
        <span className="text-xs text-muted-foreground ml-2">
          Ctrl+B: 굵게, Ctrl+I: 기울임
        </span>
      </div>
      {/* 에디터 */}
      <EditorContent
        editor={editor}
        className="bg-white"
      />
    </div>
  );
}
