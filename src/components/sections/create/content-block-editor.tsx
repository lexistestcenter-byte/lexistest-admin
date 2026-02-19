"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, FileText, Headphones, ChevronDown, ChevronRight } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FileUpload } from "@/components/ui/file-upload";
import type { ContentBlock } from "./types";

interface ContentBlockEditorProps {
  block: ContentBlock;
  index: number;
  sectionType?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: (id: string, data: Partial<ContentBlock>) => void;
  onRemove: (id: string) => void;
}

export function ContentBlockEditor({
  block,
  index,
  sectionType,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  onRemove,
}: ContentBlockEditorProps) {
  const isAudio = sectionType === "listening" || sectionType === "speaking";

  // Audio blocks (listening/speaking): compact card with inline title + audio upload
  if (isAudio) {
    const label = block.passage_title || `Audio ${index + 1}`;
    const hasAudio = !!block.audio_url;

    return (
      <div className="border rounded-lg bg-white">
        <div className="flex items-center gap-2 p-3 border-b">
          <Headphones className="h-4 w-4 text-sky-500 shrink-0" />
          <span className="text-sm font-medium flex-1 truncate">{label}</span>
          {hasAudio ? (
            <span className="text-xs text-muted-foreground shrink-0">오디오 업로드됨</span>
          ) : (
            <span className="text-xs text-orange-500 shrink-0">오디오 없음</span>
          )}
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
              placeholder="예: Section 1 Audio, Task 2 Audio..."
              value={block.passage_title}
              onChange={(e) =>
                onUpdate(block.id, { passage_title: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">오디오 파일</Label>
            <FileUpload
              value={block.audio_url}
              onChange={() => {}}
              accept="audio"
              placeholder="오디오 파일 업로드"
              deferred
              onFileReady={(file) => {
                if (file) {
                  onUpdate(block.id, {
                    audio_url: URL.createObjectURL(file),
                    audioFile: file,
                  });
                } else {
                  onUpdate(block.id, {
                    audio_url: "",
                    audioFile: null,
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Passage blocks (reading): expandable inline editor
  const label = block.passage_title || `Passage ${index + 1}`;

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center gap-2 p-3 border-b">
        <button type="button" onClick={onToggleCollapse} className="p-0.5">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <FileText className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium flex-1">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onRemove(block.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">지문 제목</Label>
            <Input
              placeholder="예: The History of Glass"
              value={block.passage_title}
              onChange={(e) =>
                onUpdate(block.id, { passage_title: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">지문 내용</Label>
            <RichTextEditor
              placeholder="지문 내용을 입력하세요..."
              minHeight="200px"
              value={block.passage_content}
              onChange={(val) =>
                onUpdate(block.id, { passage_content: val })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">각주 (선택)</Label>
            <RichTextEditor
              placeholder="예: *calorie: a measure of the energy value of food"
              minHeight="80px"
              value={block.passage_footnotes}
              onChange={(val) =>
                onUpdate(block.id, { passage_footnotes: val })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
