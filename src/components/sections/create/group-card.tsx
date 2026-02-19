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
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
  return (
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
        <span className="text-sm font-semibold flex-1">
          {autoTitle || `Set ${index + 1}`}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {group.questions.length}문제
        </Badge>
        <Button
          variant={isAddingQuestions ? "secondary" : "outline"}
          size="sm"
          className="h-7 text-xs"
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
            className="h-7 w-7"
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
          {/* Content block selector (reading/listening only) */}
          {needsContent && contentBlocks.length > 0 && (
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

          {/* Group title */}
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

          {/* Instructions */}
          <div className="space-y-1">
            <Label className="text-xs">지시문</Label>
            <RichTextEditor
              placeholder="예: Choose the correct letter A, B, C or D."
              minHeight="80px"
              value={group.instructions}
              onChange={(val) =>
                onUpdate(group.id, {
                  instructions: val,
                })
              }
            />
          </div>

          {/* 추가 안내문 */}
          <SubInstructionsToggle
            value={group.sub_instructions}
            onChange={(val) => onUpdate(group.id, { sub_instructions: val })}
          />

          {/* Items */}
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
  );
}

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
