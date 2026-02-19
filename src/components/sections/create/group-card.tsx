"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { useSensors } from "@dnd-kit/core";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SortableQuestionInGroup } from "./sortable-question-in-group";
import type { ContentBlock, QuestionGroup, Question } from "./types";

interface GroupCardProps {
  group: QuestionGroup;
  index: number;
  sectionType: string;
  isActive: boolean;
  isExpanded: boolean;
  isAddingQuestions: boolean;
  autoTitle: string;
  contentBlocks: ContentBlock[];
  needsContent: boolean;
  numberingMap: Record<string, { startNum: number; endNum: number; label: string }>;
  availableQuestions: Question[];
  sensors: ReturnType<typeof useSensors>;
  groupCount: number;
  onActivate: () => void;
  onToggleExpand: () => void;
  onUpdate: (id: string, data: Partial<QuestionGroup>) => void;
  onRemoveSet: (id: string) => void;
  onAddDrawer: () => void;
  onItemDragEnd: (event: DragEndEvent) => void;
  onRemoveQuestion: (groupId: string, questionId: string) => void;
}

export function GroupCard({
  group,
  index,
  sectionType,
  isActive,
  isExpanded,
  isAddingQuestions,
  autoTitle,
  contentBlocks,
  needsContent,
  numberingMap,
  availableQuestions,
  sensors,
  groupCount,
  onActivate,
  onToggleExpand,
  onUpdate,
  onRemoveSet,
  onAddDrawer,
  onItemDragEnd,
  onRemoveQuestion,
}: GroupCardProps) {
  const isReading = sectionType === "reading";

  // Modal state for listening/speaking
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [localInstructions, setLocalInstructions] = useState("");
  const [localSubInstructions, setLocalSubInstructions] = useState("");
  const [localContentBlockId, setLocalContentBlockId] = useState<string | null>(null);

  const openModal = () => {
    setLocalTitle(group.title || "");
    setLocalInstructions(group.instructions || "");
    setLocalSubInstructions(group.sub_instructions || "");
    setLocalContentBlockId(group.content_block_id || null);
    setIsModalOpen(true);
  };

  const saveModal = () => {
    onUpdate(group.id, {
      title: localTitle,
      instructions: localInstructions,
      sub_instructions: localSubInstructions,
      content_block_id: localContentBlockId,
    });
    setIsModalOpen(false);
  };

  const displayTitle = group.title || autoTitle || (isReading ? `Set ${index + 1}` : `Task ${index + 1}`);
  const hasInstructions = !!(group.instructions && group.instructions.replace(/<[^>]*>/g, "").trim());

  return (
    <>
      <div
        className={cn(
          "border rounded-lg transition-colors",
          isActive ? "border-primary shadow-sm" : "border-border"
        )}
        onClick={onActivate}
      >
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-t-lg">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isReading ? (
            <span className="text-sm font-semibold flex-1">
              {displayTitle}
            </span>
          ) : (
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block truncate">
                {displayTitle}
              </span>
              {hasInstructions && (
                <span className="text-xs text-muted-foreground block truncate">
                  지시문 입력됨
                </span>
              )}
            </div>
          )}
          <Badge variant="outline" className="text-[10px] shrink-0">
            {group.questions.length}문제
          </Badge>
          {!isReading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                openModal();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant={isAddingQuestions ? "secondary" : "outline"}
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddDrawer();
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            문제 추가
          </Button>
          {groupCount > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSet(group.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isExpanded && (
          <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Reading: inline form fields */}
            {isReading && (
              <>
                {contentBlocks.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">콘텐츠 블록</Label>
                    <Select
                      value={group.content_block_id || "none"}
                      onValueChange={(v) =>
                        onUpdate(group.id, {
                          content_block_id: v === "none" ? null : v,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="콘텐츠 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {contentBlocks.map((b, bi) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.content_type === "passage"
                              ? b.passage_title || `Passage ${bi + 1}`
                              : `Audio ${bi + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">그룹 제목 (자동 생성 — 직접 입력 시 오버라이드, 예: &quot;Questions 1–5&quot;)</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder={autoTitle || "문제 추가 시 자동 생성"}
                    value={group.title}
                    onChange={(e) =>
                      onUpdate(group.id, { title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">지시문</Label>
                  <RichTextEditor
                    placeholder="예: Choose the correct letter A, B, C or D."
                    minHeight="80px"
                    value={group.instructions}
                    onChange={(val) =>
                      onUpdate(group.id, { instructions: val })
                    }
                  />
                </div>

                <SubInstructionsToggle
                  value={group.sub_instructions}
                  onChange={(val) => onUpdate(group.id, { sub_instructions: val })}
                />
              </>
            )}

            {/* Items list (all section types) */}
            {group.questions.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onItemDragEnd}
              >
                <SortableContext
                  items={group.questions}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {group.questions.map((qId) => {
                      const q = availableQuestions.find(
                        (aq) => aq.id === qId
                      );
                      if (!q) return null;
                      const numInfo = numberingMap[qId];
                      return (
                        <SortableQuestionInGroup
                          key={qId}
                          id={qId}
                          numberLabel={numInfo?.label || "—"}
                          question={q}
                          onRemove={() =>
                            onRemoveQuestion(group.id, qId)
                          }
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-xs border border-dashed rounded">
                위 &quot;문제 추가&quot; 버튼을 클릭하여 문제를 추가하세요.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for listening/speaking group editing */}
      {!isReading && (
        <GroupEditDialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          sectionType={sectionType}
          localTitle={localTitle}
          setLocalTitle={setLocalTitle}
          localInstructions={localInstructions}
          setLocalInstructions={setLocalInstructions}
          localSubInstructions={localSubInstructions}
          setLocalSubInstructions={setLocalSubInstructions}
          contentBlocks={contentBlocks}
          localContentBlockId={localContentBlockId}
          setLocalContentBlockId={setLocalContentBlockId}
          questions={group.questions}
          numberingMap={numberingMap}
          onSave={saveModal}
        />
      )}
    </>
  );
}

// ─── Group Edit Dialog (listening/speaking) ────────────────────

function GroupEditDialog({
  open,
  onOpenChange,
  sectionType,
  localTitle,
  setLocalTitle,
  localInstructions,
  setLocalInstructions,
  localSubInstructions,
  setLocalSubInstructions,
  contentBlocks,
  localContentBlockId,
  setLocalContentBlockId,
  questions,
  numberingMap,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sectionType: string;
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localInstructions: string;
  setLocalInstructions: (v: string) => void;
  localSubInstructions: string;
  setLocalSubInstructions: (v: string) => void;
  contentBlocks: ContentBlock[];
  localContentBlockId: string | null;
  setLocalContentBlockId: (v: string | null) => void;
  questions: string[];
  numberingMap: Record<string, { startNum: number; endNum: number; label: string }>;
  onSave: () => void;
}) {
  const [showSubInstructions, setShowSubInstructions] = useState(() =>
    Boolean(localSubInstructions?.replace(/<[^>]*>/g, '').trim())
  );

  const isWriting = sectionType === "writing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* ─── Top bar ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
          <DialogTitle className="text-sm font-semibold">
            그룹 설정
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
              onClick={onSave}
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
          {/* 상단: 그룹 헤더 편집 영역 */}
          <div className={cn(
            "px-5 py-4 shrink-0 border-b space-y-3",
            isWriting ? "bg-sky-50 border-sky-200" : "bg-slate-200 border-slate-300"
          )}>
            {/* 오디오 블록 선택 (listening/speaking only) */}
            {!isWriting && contentBlocks.length > 0 && (
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
                      <SelectItem key={b.id} value={b.id}>
                        {b.passage_title || `Audio ${i + 1}`}
                      </SelectItem>
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
                  checked={showSubInstructions}
                  onCheckedChange={setShowSubInstructions}
                />
                <Label className="text-xs text-gray-600 cursor-pointer">추가 안내문</Label>
              </div>
              {showSubInstructions && (
                <RichTextEditor
                  placeholder="예: Write ONE WORD ONLY for each answer."
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
              {questions.length > 0 ? (
                questions.map((qId) => {
                  const numInfo = numberingMap[qId];
                  const numLabel = numInfo
                    ? (numInfo.startNum === numInfo.endNum
                      ? `Q${numInfo.startNum}`
                      : `Q${numInfo.startNum}–${numInfo.endNum}`)
                    : "—";
                  return (
                    <div key={qId} className="flex items-center gap-2 py-1.5">
                      <span className="text-xs font-bold text-gray-700 shrink-0 w-14">{numLabel}</span>
                      <span className="text-sm text-gray-600 truncate">{qId}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 italic">문제가 추가되면 여기에 표시됩니다.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-instructions toggle (reading inline) ──────────────────

function SubInstructionsToggle({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [show, setShow] = useState(() =>
    Boolean(value?.replace(/<[^>]*>/g, '').trim())
  );
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Switch checked={show} onCheckedChange={setShow} />
        <Label className="text-xs cursor-pointer">추가 안내문</Label>
      </div>
      {show && (
        <RichTextEditor
          placeholder="예: Write ONE WORD ONLY for each answer."
          minHeight="60px"
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
