"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableGroupItemRow } from "./sortable-group-item-row";
import type { EditGroupCardProps } from "./types";

export function EditGroupCard({
  group,
  isActive,
  isAddingQuestions,
  autoTitle,
  sensors,
  onActivate,
  onRemove,
  onRemoveItem,
  onItemDragEnd,
  onAddQuestions,
  onEditGroup,
}: EditGroupCardProps & { onEditGroup?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const displayTitle = group.title || autoTitle;
  const hasInstructions = !!(group.instructions && group.instructions.replace(/<[^>]*>/g, "").trim());

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
        <Badge variant="outline" className="text-[10px] shrink-0">
          {group.numberedItems.length}문제
        </Badge>
        {onEditGroup && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEditGroup();
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
            onAddQuestions();
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          문제 추가
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(group.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
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
