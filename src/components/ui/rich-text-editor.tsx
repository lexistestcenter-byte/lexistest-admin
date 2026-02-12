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
import { useEffect, useRef, useCallback } from "react";
import { uploadFile } from "./file-upload";
import { toast } from "sonner";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

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
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const file = new File([blob], `editor-image.${ext}`, { type: blob.type });
      const { path } = await uploadFile(file, "image", context);
      const escaped = blobUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "g"), path);
    } catch (e) {
      console.error("Failed to upload editor image:", e);
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
    editorRef.current?.chain().focus().setImage({ src: blobUrl }).run();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
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
      onChange(contentToStorage(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2",
          "[&_p]:my-1 [&_strong]:font-bold [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-1",
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

  // 외부에서 value가 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && value !== contentToStorage(editor.getHTML())) {
      editor.commands.setContent(contentToEditor(value));
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
        {/* 텍스트 크기 드롭다운 */}
        <div className="relative">
          <select
            value={
              editor.isActive("heading", { level: 1 }) ? "h1"
                : editor.isActive("heading", { level: 2 }) ? "h2"
                  : editor.isActive("heading", { level: 3 }) ? "h3"
                    : "p"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "p") {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(val.replace("h", "")) as 1 | 2 | 3;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            className="h-8 pl-2 pr-6 text-xs border-0 bg-transparent rounded hover:bg-slate-200 cursor-pointer focus:outline-none focus:ring-0 appearance-none"
          >
            <option value="p">본문</option>
            <option value="h1">제목 1</option>
            <option value="h2">제목 2</option>
            <option value="h3">제목 3</option>
          </select>
          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
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
