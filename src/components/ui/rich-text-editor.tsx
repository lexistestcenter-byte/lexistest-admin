"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 필요한 것만 활성화
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
    ],
    content: value,
    immediatelyRender: false, // SSR hydration 에러 방지
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2",
          "[&_p]:my-1 [&_strong]:font-bold"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // 외부에서 value가 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
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
        <span className="text-xs text-muted-foreground ml-2">
          Ctrl+B: 굵게, Ctrl+I: 기울임
        </span>
      </div>
      {/* 에디터 */}
      <EditorContent
        editor={editor}
        className="bg-white"
      />
      {!value && placeholder && (
        <p className="absolute top-[50px] left-3 text-muted-foreground pointer-events-none">
          {placeholder}
        </p>
      )}
    </div>
  );
}
