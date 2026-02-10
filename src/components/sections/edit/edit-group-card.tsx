"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SortableGroupItemRow } from "./sortable-group-item-row";
import type { EditGroupCardProps } from "./types";

export function EditGroupCard({
  group,
  isActive,
  isAddingQuestions,
  autoTitle,
  contentBlocks,
  sectionType,
  sensors,
  onActivate,
  onUpdate,
  onRemove,
  onRemoveItem,
  onItemDragEnd,
  onAddQuestions,
}: EditGroupCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [localTitle, setLocalTitle] = useState(group.title || "");
  const [localInstructions, setLocalInstructions] = useState(
    group.instructions || ""
  );

  // Debounced save for title/instructions
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate(group.id, {
        title: localTitle || null,
        instructions: localInstructions || null,
      });
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle, localInstructions]);

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
            setExpanded(!expanded);
          }}
          className="p-0.5"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <span className="text-sm font-semibold flex-1">
          {autoTitle}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {group.numberedItems.length}문제
        </Badge>
        <Button
          variant={isAddingQuestions ? "secondary" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onAddQuestions();
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          문제 추가
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(group.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Content block selector (reading/listening only) */}
          {(sectionType === "reading" || sectionType === "listening") && contentBlocks.length > 0 && (
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
            <Label className="text-xs">그룹 제목 (자동 생성 — 직접 입력 시 오버라이드, 예: &quot;Questions 1–5&quot;)</Label>
            <Input
              className="h-8 text-xs"
              placeholder={autoTitle || "문제 추가 시 자동 생성"}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1">
            <Label className="text-xs">지시문</Label>
            <RichTextEditor
              placeholder="예: Choose the correct letter A, B, C or D."
              minHeight="80px"
              value={localInstructions}
              onChange={(val) => setLocalInstructions(val)}
            />
          </div>

          {/* Items */}
          {group.numberedItems.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onItemDragEnd}
            >
              <SortableContext
                items={group.numberedItems.map((i) => i.item_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {group.numberedItems.map((item) => {
                    const numLabel =
                      item.startNum === item.endNum
                        ? `Q${item.startNum}`
                        : `Q${item.startNum}-${item.endNum}`;
                    return (
                      <SortableGroupItemRow
                        key={item.item_id}
                        item={item}
                        numberLabel={numLabel}
                        onRemove={() => onRemoveItem(item.item_id)}
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
