"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { ContentBlock, QuestionGroupData } from "./types";

interface GroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create new group */
  group: QuestionGroupData | null;
  sectionType: string;
  contentBlocks: ContentBlock[];
  onSave: (
    data: { title: string | null; instructions: string | null; content_block_id: string | null },
    existingId: string | null
  ) => void;
}

export function GroupEditModal({
  open,
  onOpenChange,
  group,
  sectionType,
  contentBlocks,
  onSave,
}: GroupEditModalProps) {
  const [localTitle, setLocalTitle] = useState("");
  const [localInstructions, setLocalInstructions] = useState("");
  const [localContentBlockId, setLocalContentBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocalTitle(group?.title || "");
      setLocalInstructions(group?.instructions || "");
      setLocalContentBlockId(group?.content_block_id || (contentBlocks.length > 0 ? contentBlocks[0].id : null));
    }
  }, [open, group, contentBlocks]);

  const isWriting = sectionType === "writing";
  const hasContentBlocks = (sectionType === "reading" || sectionType === "listening") && contentBlocks.length > 0;

  const handleSave = () => {
    onSave(
      {
        title: localTitle || null,
        instructions: localInstructions || null,
        content_block_id: hasContentBlocks ? localContentBlockId : null,
      },
      group?.id || null,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* ─── Top bar ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
          <DialogTitle className="text-sm font-semibold">
            {group ? "섹션 편집" : "새 섹션 추가"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-600 h-8"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="bg-white text-slate-700 hover:bg-slate-100 h-8"
              onClick={handleSave}
            >
              저장
            </Button>
            <button
              type="button"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex-1 bg-slate-200 overflow-hidden flex flex-col min-h-0">
          {isWriting ? (
            <WritingLayout
              localTitle={localTitle}
              setLocalTitle={setLocalTitle}
              localInstructions={localInstructions}
              setLocalInstructions={setLocalInstructions}
            />
          ) : (
            <ReadingLayout
              localTitle={localTitle}
              setLocalTitle={setLocalTitle}
              localInstructions={localInstructions}
              setLocalInstructions={setLocalInstructions}
              localContentBlockId={localContentBlockId}
              setLocalContentBlockId={setLocalContentBlockId}
              contentBlocks={contentBlocks}
              hasContentBlocks={hasContentBlocks}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Reading / Listening Layout
   ═══════════════════════════════════════════════════════════════ */

function ReadingLayout({
  localTitle,
  setLocalTitle,
  localInstructions,
  setLocalInstructions,
  localContentBlockId,
  setLocalContentBlockId,
  contentBlocks,
  hasContentBlocks,
}: {
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localInstructions: string;
  setLocalInstructions: (v: string) => void;
  localContentBlockId: string | null;
  setLocalContentBlockId: (v: string | null) => void;
  contentBlocks: ContentBlock[];
  hasContentBlocks: boolean;
}) {
  const selectedBlock = contentBlocks.find(b => b.id === localContentBlockId);

  return (
    <div className="flex-1 overflow-hidden grid grid-cols-2 min-h-0">
      {/* LEFT: Passage from selected content block */}
      <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto p-4">
        <div className="bg-white rounded-lg border p-6">
          {selectedBlock ? (
            <>
              {selectedBlock.passage_title && (
                <h2 className="text-lg font-bold mb-4">{selectedBlock.passage_title}</h2>
              )}
              {selectedBlock.passage_content ? (
                <div
                  className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(selectedBlock.passage_content) }}
                />
              ) : (
                <p className="text-sm text-gray-400 italic">지문 내용이 없습니다.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">콘텐츠 블록을 선택하면 지문이 여기에 표시됩니다.</p>
          )}
        </div>
      </div>

      {/* RIGHT: Group header editor + dummy questions */}
      <div className="col-span-1 overflow-hidden flex flex-col bg-white">
        {/* Group header — editable (matches question-panel.tsx bg-slate-200 style) */}
        <div className="bg-slate-200 px-5 py-4 shrink-0 border-b border-slate-300 space-y-3">
          {/* Content block selector */}
          {hasContentBlocks && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">콘텐츠 블록</Label>
              <Select
                value={localContentBlockId || "none"}
                onValueChange={(v) => setLocalContentBlockId(v === "none" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="콘텐츠 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {contentBlocks.map((b, i) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.content_type === "passage"
                        ? b.passage_title || `Passage ${i + 1}`
                        : `Audio ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Group title */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">그룹 제목 (비워두면 자동 생성)</Label>
            <Input
              className="h-9 text-base font-bold bg-white"
              placeholder="예: Questions 1–4"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
            />
          </div>
          {/* Instructions */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">지시문</Label>
            <RichTextEditor
              placeholder="예: Choose the correct letter, A, B, C or D."
              minHeight="60px"
              value={localInstructions}
              onChange={(val) => setLocalInstructions(val)}
            />
          </div>
        </div>

        {/* Dummy questions */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="opacity-50 pointer-events-none select-none space-y-4">
            <DummyMCQ num={1} text="The passage mentions the Fertile Crescent primarily to..." />
            <DummyMCQ num={2} text="According to the author, irrigation systems were important because they..." />
            <DummyMCQ num={3} text="The three-field rotation system helped farmers to..." />
            <DummyMCQ num={4} text="What does the writer suggest about the Industrial Revolution?" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Writing Layout
   ═══════════════════════════════════════════════════════════════ */

function WritingLayout({
  localTitle,
  setLocalTitle,
  localInstructions,
  setLocalInstructions,
}: {
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localInstructions: string;
  setLocalInstructions: (v: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Top: Title + Instructions editor (bg-sky-50, matches writing-panel.tsx) */}
      <div className="bg-sky-50 border-b border-sky-200 px-6 py-4 shrink-0 space-y-3">
        {/* Title */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">그룹 제목 (비워두면 자동 생성)</Label>
          <Input
            className="h-9 text-lg font-bold bg-white"
            placeholder="예: Writing Task 1"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
          />
        </div>
        {/* Instructions */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">지시문</Label>
          <RichTextEditor
            placeholder="예: You should spend about 20 minutes on this task."
            minHeight="60px"
            value={localInstructions}
            onChange={(val) => setLocalInstructions(val)}
          />
        </div>
      </div>

      {/* Bottom: 2-column dummy (passage + answer area) */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden min-h-0 opacity-50 pointer-events-none select-none">
        {/* Left: Dummy passage */}
        <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto p-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <div className="text-sm leading-[1.8] text-gray-700 space-y-3">
              <p>The graph below shows the number of visitors to three London museums between 2007 and 2012.</p>
              <p>Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p>
              <p className="text-xs text-gray-500 italic mt-4">Write at least 150 words.</p>
            </div>
          </div>
        </div>

        {/* Right: Dummy textarea */}
        <div className="col-span-1 bg-white overflow-y-auto p-4 flex flex-col">
          <div className="w-full flex-1 min-h-[300px] text-sm border border-slate-300 rounded-lg p-4 text-gray-400">
            Write your answer here...
          </div>
          <div className="mt-2 text-right text-xs text-gray-400">
            Word Count: 0
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dummy question components ─── */

function DummyMCQ({ num, text }: { num: number; text: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-bold mr-1">{num}.</span>
        {text}
      </p>
      <div className="space-y-1.5 pl-4">
        <DummyOption label="A" text="describe a historical event" />
        <DummyOption label="B" text="explain a scientific process" />
        <DummyOption label="C" text="compare different approaches" />
        <DummyOption label="D" text="argue for a particular viewpoint" />
      </div>
    </div>
  );
}

function DummyOption({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
      <span className="text-sm text-gray-500">{label}. {text}</span>
    </div>
  );
}
