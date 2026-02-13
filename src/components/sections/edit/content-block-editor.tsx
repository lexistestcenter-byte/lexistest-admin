"use client";

import { Button } from "@/components/ui/button";
import { FileText, Headphones, Pencil, Trash2 } from "lucide-react";
import type { ContentBlock } from "./types";

interface ContentBlockEditorProps {
  block: ContentBlock;
  index: number;
  onEdit: (block: ContentBlock) => void;
  onRemove: (id: string) => void;
}

export function ContentBlockEditor({
  block,
  index,
  onEdit,
  onRemove,
}: ContentBlockEditorProps) {
  const label =
    block.content_type === "passage"
      ? block.passage_title || `Passage ${index + 1}`
      : block.passage_title || `Audio ${index + 1}`;

  const hasContent = !!(block.passage_content && block.passage_content.replace(/<[^>]*>/g, "").trim());

  return (
    <div className="border rounded-lg bg-white flex items-center gap-2 p-3">
      {block.content_type === "passage" ? (
        <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <Headphones className="h-4 w-4 text-sky-500 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{label}</span>
        {hasContent && (
          <span className="text-xs text-muted-foreground truncate block">
            지문 입력됨
          </span>
        )}
        {!hasContent && (
          <span className="text-xs text-orange-500 truncate block">
            내용 없음
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => onEdit(block)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => onRemove(block.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
