"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatLabels } from "@/components/sections/constants";
import { QuestionDetailPreview } from "@/components/sections/question-detail-preview";
import { stripHtml } from "@/lib/utils/sanitize";
import type { Question } from "./types";

interface SortableQuestionInGroupProps {
  id: string;
  numberLabel: string;
  question: Question;
  onRemove: () => void;
}

export function SortableQuestionInGroup({
  id,
  numberLabel,
  question,
  onRemove,
}: SortableQuestionInGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("bg-muted/50 rounded", isDragging && "shadow-lg")}
    >
      <div className="flex items-center gap-2 p-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-xs font-mono font-semibold text-primary min-w-[50px]">
          {numberLabel}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {question.question_code}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {formatLabels[question.question_format] || question.question_format}
        </Badge>
        <span className="flex-1 text-xs text-muted-foreground">
          {stripHtml(question.title || question.content)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && <QuestionDetailPreview question={question} />}
    </div>
  );
}
