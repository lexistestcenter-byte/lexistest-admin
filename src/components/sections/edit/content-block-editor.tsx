"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, FileText, Headphones, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { ContentBlock } from "./types";

interface ContentBlockEditorProps {
  block: ContentBlock;
  index: number;
  onUpdate: (id: string, data: Partial<ContentBlock>) => void;
  onRemove: (id: string) => void;
  sectionId: string;
}

export function ContentBlockEditor({
  block,
  index,
  onUpdate,
  onRemove,
  sectionId,
}: ContentBlockEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [localTitle, setLocalTitle] = useState(block.passage_title || "");
  const [localContent, setLocalContent] = useState(block.passage_content || "");
  const [localFootnotes, setLocalFootnotes] = useState(block.passage_footnotes || "");
  const [localAudioUrl, setLocalAudioUrl] = useState(block.audio_url || "");

  const label =
    block.content_type === "passage"
      ? block.passage_title || `Passage ${index + 1}`
      : block.passage_title || `Audio ${index + 1}`;

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (block.content_type === "passage") {
        onUpdate(block.id, {
          passage_title: localTitle || null,
          passage_content: localContent || null,
          passage_footnotes: localFootnotes || null,
        } as Partial<ContentBlock>);
      } else {
        onUpdate(block.id, {
          audio_url: localAudioUrl || null,
          passage_title: localTitle || null,
          passage_content: localContent || null,
          passage_footnotes: localFootnotes || null,
        } as Partial<ContentBlock>);
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle, localContent, localFootnotes, localAudioUrl]);

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center gap-2 p-3 border-b">
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="p-0.5">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {block.content_type === "passage" ? (
          <FileText className="h-4 w-4 text-emerald-500" />
        ) : (
          <Headphones className="h-4 w-4 text-sky-500" />
        )}
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

      {!collapsed && (
        <div className="p-4 space-y-3">
          {block.content_type === "passage" ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">지문 제목</Label>
                <Input
                  placeholder="예: The History of Glass"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">지문 내용</Label>
                <RichTextEditor
                  placeholder="지문 내용을 입력하세요..."
                  minHeight="200px"
                  value={localContent}
                  onChange={(val) => setLocalContent(val)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">각주 (선택)</Label>
                <RichTextEditor
                  placeholder="예: *calorie: a measure of the energy value of food"
                  minHeight="80px"
                  value={localFootnotes}
                  onChange={(val) => setLocalFootnotes(val)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">오디오 파일</Label>
                <FileUpload
                  value={localAudioUrl}
                  onChange={(url) => setLocalAudioUrl(url)}
                  accept="audio"
                  placeholder="오디오 파일 업로드"
                  context={`sections/${sectionId}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">지문 제목</Label>
                <Input
                  placeholder="예: The History of Glass"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">지문 내용</Label>
                <RichTextEditor
                  placeholder="지문 내용을 입력하세요..."
                  minHeight="200px"
                  value={localContent}
                  onChange={(val) => setLocalContent(val)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">각주 (선택)</Label>
                <RichTextEditor
                  placeholder="예: *calorie: a measure of the energy value of food"
                  minHeight="80px"
                  value={localFootnotes}
                  onChange={(val) => setLocalFootnotes(val)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
