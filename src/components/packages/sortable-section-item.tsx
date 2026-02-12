"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableSectionItemProps {
  id: string;
  index: number;
  title: string;
  sectionType: string;
  timeLimitMinutes: number | null;
  typeColors: Record<string, string>;
  onRemove: () => void;
}

export function SortableSectionItem({
  id,
  index,
  title,
  sectionType,
  timeLimitMinutes,
  typeColors,
  onRemove,
}: SortableSectionItemProps) {
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
      className={cn(
        "flex items-center gap-3 p-3 bg-muted/50 rounded-lg",
        isDragging && "shadow-lg z-10"
      )}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium w-6 text-muted-foreground">
        {index + 1}.
      </span>
      <span
        className={`px-2 py-0.5 text-xs rounded ${typeColors[sectionType] || ""}`}
      >
        {sectionType.charAt(0).toUpperCase()}
      </span>
      <span className="flex-1 font-medium text-sm truncate">{title}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {timeLimitMinutes ? `${timeLimitMinutes}분` : "-"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
