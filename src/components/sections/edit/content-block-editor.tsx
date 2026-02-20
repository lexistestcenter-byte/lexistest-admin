"use client";

import { Button } from "@/components/ui/button";
import { FileText, Volume2, Pencil, Trash2 } from "lucide-react";
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
  const isAudio = block.content_type === "audio" || !!block.audio_url;
  const label = isAudio
    ? block.passage_title || `Audio ${index + 1}`
    : block.passage_title || `Passage ${index + 1}`;

  // Compact row with edit button (opens modal)
  const hasContent = isAudio
    ? !!block.audio_url
    : !!(block.passage_content && block.passage_content.replace(/<[^>]*>/g, "").trim());
  const statusText = isAudio
    ? (hasContent ? "오디오 업로드됨" : "오디오 없음")
    : (hasContent ? "지문 입력됨" : "내용 없음");
  const icon = isAudio
    ? <Volume2 className="h-4 w-4 text-sky-500 shrink-0" />
    : <FileText className="h-4 w-4 text-emerald-500 shrink-0" />;

  return (
    <div className="border rounded-lg bg-white flex items-center gap-2 p-3">
      {icon}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{label}</span>
        {hasContent ? (
          <span className="text-xs text-muted-foreground truncate block">
            {statusText}
          </span>
        ) : (
          <span className="text-xs text-orange-500 truncate block">
            {statusText}
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
