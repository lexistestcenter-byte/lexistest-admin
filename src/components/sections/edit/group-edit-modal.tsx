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
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";
import type { ContentBlock, QuestionGroupData, NumberedItem } from "./types";

interface GroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create new group */
  group: QuestionGroupData | null;
  sectionType: string;
  contentBlocks: ContentBlock[];
  items?: NumberedItem[];
  onSave: (
    data: { title: string | null; instructions: string | null; sub_instructions: string | null; content_block_id: string | null },
    existingId: string | null
  ) => void;
}

export function GroupEditModal({
  open,
  onOpenChange,
  group,
  sectionType,
  contentBlocks,
  items,
  onSave,
}: GroupEditModalProps) {
  const [localTitle, setLocalTitle] = useState("");
  const [localInstructions, setLocalInstructions] = useState("");
  const [localSubInstructions, setLocalSubInstructions] = useState("");
  const [localContentBlockId, setLocalContentBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocalTitle(group?.title || "");
      setLocalInstructions(group?.instructions || "");
      setLocalSubInstructions(group?.sub_instructions || "");
      setLocalContentBlockId(group?.content_block_id || (contentBlocks.length > 0 ? contentBlocks[0].id : null));
    }
  }, [open, group, contentBlocks]);

  const isWriting = sectionType === "writing";
  const isSpeaking = sectionType === "speaking";
  const hasContentBlocks = (sectionType === "reading" || sectionType === "listening" || sectionType === "speaking") && contentBlocks.length > 0;

  const handleSave = () => {
    onSave(
      {
        title: localTitle || null,
        instructions: localInstructions || null,
        sub_instructions: localSubInstructions || null,
        content_block_id: (hasContentBlocks || isSpeaking) ? localContentBlockId : null,
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
              localSubInstructions={localSubInstructions}
              setLocalSubInstructions={setLocalSubInstructions}
              items={items}
            />
          ) : isSpeaking ? (
            <SpeakingLayout
              localTitle={localTitle}
              setLocalTitle={setLocalTitle}
              localInstructions={localInstructions}
              setLocalInstructions={setLocalInstructions}
              localSubInstructions={localSubInstructions}
              setLocalSubInstructions={setLocalSubInstructions}
              contentBlocks={contentBlocks}
              localContentBlockId={localContentBlockId}
              setLocalContentBlockId={setLocalContentBlockId}
              items={items}
            />
          ) : (
            <ReadingLayout
              localTitle={localTitle}
              setLocalTitle={setLocalTitle}
              localInstructions={localInstructions}
              setLocalInstructions={setLocalInstructions}
              localSubInstructions={localSubInstructions}
              setLocalSubInstructions={setLocalSubInstructions}
              localContentBlockId={localContentBlockId}
              setLocalContentBlockId={setLocalContentBlockId}
              contentBlocks={contentBlocks}
              hasContentBlocks={hasContentBlocks}
              items={items}
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
  localSubInstructions,
  setLocalSubInstructions,
  localContentBlockId,
  setLocalContentBlockId,
  contentBlocks,
  hasContentBlocks,
  items,
}: {
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localInstructions: string;
  setLocalInstructions: (v: string) => void;
  localSubInstructions: string;
  setLocalSubInstructions: (v: string) => void;
  localContentBlockId: string | null;
  setLocalContentBlockId: (v: string | null) => void;
  contentBlocks: ContentBlock[];
  hasContentBlocks: boolean;
  items?: NumberedItem[];
}) {
  const selectedBlock = contentBlocks.find(b => b.id === localContentBlockId);
  const [showSubInstructions, setShowSubInstructions] = useState(() =>
    Boolean(localSubInstructions && localSubInstructions.replace(/<[^>]*>/g, '').trim())
  );

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
          {/* 추가 안내문 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="sub-instructions-toggle-reading"
                checked={showSubInstructions}
                onCheckedChange={setShowSubInstructions}
              />
              <Label htmlFor="sub-instructions-toggle-reading" className="text-xs text-gray-600 cursor-pointer">
                추가 안내문
              </Label>
            </div>
            {showSubInstructions && (
              <RichTextEditor
                placeholder="예: Write ONE WORD ONLY for each answer."
                minHeight="60px"
                value={localSubInstructions}
                onChange={(val) => setLocalSubInstructions(val)}
              />
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="opacity-50 pointer-events-none select-none space-y-4">
            {items && items.length > 0 ? (
              items.map((item) => {
                const qi = item.question_info;
                const numLabel = item.startNum === item.endNum
                  ? `Q${item.startNum}`
                  : `Q${item.startNum}–${item.endNum}`;
                const label = qi.title || qi.question_format;
                return (
                  <div key={item.item_id} className="flex items-center gap-2 py-1.5">
                    <span className="text-xs font-bold text-gray-700 shrink-0 w-14">{numLabel}</span>
                    <span className="text-sm text-gray-600 truncate">{label}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{qi.question_format}</span>
                  </div>
                );
              })
            ) : (
              <>
                <DummyMCQ num={1} text="The passage mentions the Fertile Crescent primarily to..." />
                <DummyMCQ num={2} text="According to the author, irrigation systems were important because they..." />
                <DummyMCQ num={3} text="The three-field rotation system helped farmers to..." />
                <DummyMCQ num={4} text="What does the writer suggest about the Industrial Revolution?" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Speaking Layout
   ═══════════════════════════════════════════════════════════════ */

function SpeakingLayout({
  localTitle,
  setLocalTitle,
  localInstructions,
  setLocalInstructions,
  localSubInstructions,
  setLocalSubInstructions,
  contentBlocks,
  localContentBlockId,
  setLocalContentBlockId,
  items,
}: {
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localInstructions: string;
  setLocalInstructions: (v: string) => void;
  localSubInstructions: string;
  setLocalSubInstructions: (v: string) => void;
  contentBlocks: ContentBlock[];
  localContentBlockId: string | null;
  setLocalContentBlockId: (v: string | null) => void;
  items?: NumberedItem[];
}) {
  const [showSubInstructions, setShowSubInstructions] = useState(() =>
    Boolean(localSubInstructions && localSubInstructions.replace(/<[^>]*>/g, '').trim())
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {/* 상단: 그룹 헤더 편집 영역 */}
      <div className="bg-slate-200 px-5 py-4 shrink-0 border-b border-slate-300 space-y-3">
        {/* 오디오 블록 선택 */}
        {contentBlocks.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">오디오 블록</Label>
            <Select
              value={localContentBlockId || "none"}
              onValueChange={(v) => setLocalContentBlockId(v === "none" ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue placeholder="오디오 선택..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                {contentBlocks.map((b, i) => (
                  <SelectItem key={b.id} value={b.id}>Audio {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* 그룹 제목 */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">그룹 제목 (비워두면 자동 생성)</Label>
          <Input
            className="h-9 text-base font-bold bg-white"
            placeholder="예: Questions 1–3"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
          />
        </div>
        {/* 지시문 */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">지시문</Label>
          <RichTextEditor
            placeholder="예: Answer the following questions."
            minHeight="60px"
            value={localInstructions}
            onChange={setLocalInstructions}
          />
        </div>
        {/* 추가 안내문 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id="sub-instructions-toggle-speaking"
              checked={showSubInstructions}
              onCheckedChange={setShowSubInstructions}
            />
            <Label htmlFor="sub-instructions-toggle-speaking" className="text-xs text-gray-600 cursor-pointer">
              추가 안내문
            </Label>
          </div>
          {showSubInstructions && (
            <RichTextEditor
              placeholder="예: You will have 30 seconds to answer."
              minHeight="60px"
              value={localSubInstructions}
              onChange={setLocalSubInstructions}
            />
          )}
        </div>
      </div>

      {/* 하단: 문제 항목 리스트 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
        <div className="opacity-50 pointer-events-none select-none space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => {
              const qi = item.question_info;
              const numLabel = item.startNum === item.endNum
                ? `Q${item.startNum}`
                : `Q${item.startNum}–${item.endNum}`;
              const label = qi.title || qi.question_format;
              return (
                <div key={item.item_id} className="flex items-center gap-2 py-1.5">
                  <span className="text-xs font-bold text-gray-700 shrink-0 w-14">{numLabel}</span>
                  <span className="text-sm text-gray-600 truncate">{label}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{qi.question_format}</span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 italic">문제가 추가되면 여기에 표시됩니다.</p>
          )}
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
  localSubInstructions,
  setLocalSubInstructions,
  items,
}: {
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localInstructions: string;
  setLocalInstructions: (v: string) => void;
  localSubInstructions: string;
  setLocalSubInstructions: (v: string) => void;
  items?: NumberedItem[];
}) {
  const firstQuestion = items?.[0]?.question_info;
  const [showSubInstructions, setShowSubInstructions] = useState(() =>
    Boolean(localSubInstructions && localSubInstructions.replace(/<[^>]*>/g, '').trim())
  );
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
        {/* 추가 안내문 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              id="sub-instructions-toggle-writing"
              checked={showSubInstructions}
              onCheckedChange={setShowSubInstructions}
            />
            <Label htmlFor="sub-instructions-toggle-writing" className="text-xs text-gray-600 cursor-pointer">
              추가 안내문
            </Label>
          </div>
          {showSubInstructions && (
            <RichTextEditor
              placeholder="예: Write ONE WORD ONLY for each answer."
              minHeight="60px"
              value={localSubInstructions}
              onChange={(val) => setLocalSubInstructions(val)}
            />
          )}
        </div>
      </div>

      {/* Bottom: 2-column dummy (passage + answer area) */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden min-h-0">
        {/* Left: Passage from question or dummy */}
        <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto p-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            {firstQuestion?.content ? (
              <div
                className="text-sm leading-[1.8] text-gray-700 prose prose-sm max-w-none [&_p]:my-3"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(firstQuestion.content) }}
              />
            ) : (
              <div className="text-sm leading-[1.8] text-gray-700 space-y-3">
                <p>The graph below shows the number of visitors to three London museums between 2007 and 2012.</p>
                <p>Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p>
                <p className="text-xs text-gray-500 italic mt-4">Write at least 150 words.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Textarea */}
        <div className="col-span-1 bg-white overflow-y-auto p-4 flex flex-col">
          <textarea
            className="w-full flex-1 min-h-[300px] text-sm border border-slate-300 rounded-lg p-4 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Write your answer here..."
          />
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
