"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Eye, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { formatLabels } from "@/components/sections/constants";
import { QuestionDetailPreview } from "@/components/sections/question-detail-preview";
import { stripHtml } from "@/lib/utils/sanitize";
import type { GroupItem } from "./types";

interface SortableGroupItemRowProps {
  item: GroupItem;
  numberLabel: string;
  onRemove: () => void;
}

export function SortableGroupItemRow({
  item,
  numberLabel,
  onRemove,
}: SortableGroupItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.item_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const info = item.question_info;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-muted/50 rounded",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <div {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-xs font-mono font-semibold text-primary min-w-[50px]">
          {numberLabel}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {info.question_code}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {formatLabels[info.question_format] || info.question_format}
        </Badge>
        <span className="flex-1 text-xs text-muted-foreground truncate min-w-0">
          {stripHtml(info.title || info.content)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && info.options_data !== undefined && (
        <div className="px-2 pb-2">
          <QuestionDetailPreview
            question={{
              question_format: info.question_format,
              content: info.content,
              instructions: info.instructions,
              options_data: info.options_data,
              answer_data: info.answer_data,
            }}
          />
        </div>
      )}
    </div>
  );
}
