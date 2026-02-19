"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { FileText, Headphones, Pencil, Trash2 } from "lucide-react";
import type { ContentBlock } from "./types";

interface ContentBlockEditorProps {
  block: ContentBlock;
  index: number;
  sectionId: string;
  onEdit: (block: ContentBlock) => void;
  onUpdate: (id: string, data: Partial<ContentBlock>) => void;
  onRemove: (id: string) => void;
}

export function ContentBlockEditor({
  block,
  index,
  sectionId,
  onEdit,
  onUpdate,
  onRemove,
}: ContentBlockEditorProps) {
  const isAudio = block.content_type === "audio";
  const label =
    block.content_type === "passage"
      ? block.passage_title || `Passage ${index + 1}`
      : block.passage_title || `Audio ${index + 1}`;

  // Audio blocks: inline editing
  if (isAudio) {
    return (
      <div className="border rounded-lg bg-white">
        <div className="flex items-center gap-2 p-3 border-b">
          <Headphones className="h-4 w-4 text-sky-500 shrink-0" />
          <span className="text-sm font-medium flex-1 truncate">{label}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onRemove(block.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="p-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">오디오 제목</Label>
            <Input
              className="h-8 text-sm"
              placeholder="예: Section 1 Audio, Task 2 Audio..."
              value={block.passage_title || ""}
              onChange={(e) => onUpdate(block.id, { passage_title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">오디오 파일</Label>
            <FileUpload
              value={block.audio_url || ""}
              onChange={(url) => onUpdate(block.id, { audio_url: url })}
              accept="audio"
              placeholder="오디오 파일 업로드"
              context={`sections/${sectionId}`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Passage blocks: compact row with edit button (opens modal)
  const hasContent = !!(block.passage_content && block.passage_content.replace(/<[^>]*>/g, "").trim());

  return (
    <div className="border rounded-lg bg-white flex items-center gap-2 p-3">
      <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{label}</span>
        {hasContent ? (
          <span className="text-xs text-muted-foreground truncate block">
            지문 입력됨
          </span>
        ) : (
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
