"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, Plus, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLabels } from "@/components/sections/constants";
import { QuestionDetailPreview } from "@/components/sections/question-detail-preview";
import { stripHtml } from "@/lib/utils/sanitize";
import type { AvailableQuestion } from "./types";

interface QuestionAddDrawerProps {
  addDrawerGroupId: string | null;
  sectionType: string;
  isPractice: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isLoadingQuestions: boolean;
  availableQuestions: AvailableQuestion[];
  selectedForAdd: string[];
  setSelectedForAdd: (v: string[] | ((prev: string[]) => string[])) => void;
  expandedQuestionId: string | null;
  setExpandedQuestionId: (v: string | null) => void;
  onClose: () => void;
  onAddQuestions: () => void;
  onCreateQuestion: () => void;
}

export function QuestionAddDrawer({
  addDrawerGroupId,
  sectionType,
  isPractice,
  searchQuery,
  setSearchQuery,
  isLoadingQuestions,
  availableQuestions,
  selectedForAdd,
  setSelectedForAdd,
  expandedQuestionId,
  setExpandedQuestionId,
  onClose,
  onAddQuestions,
  onCreateQuestion,
}: QuestionAddDrawerProps) {
  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full w-[420px] bg-white border-r shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out",
        addDrawerGroupId ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <h3 className="text-sm font-semibold">문제 추가</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}{" "}
            유형
            {isPractice ? " (연습문제만)" : " (실전문제만)"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="문제 코드, 제목, 내용으로 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {isLoadingQuestions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableQuestions.length > 0 ? (
          availableQuestions.map((q) => {
            const isChecked = selectedForAdd.includes(q.id);
            const isQExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id}
                className={cn(
                  "transition-colors",
                  isChecked && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2 p-2.5">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() =>
                      setSelectedForAdd((prev: string[]) =>
                        prev.includes(q.id)
                          ? prev.filter((i: string) => i !== q.id)
                          : [...prev, q.id]
                      )
                    }
                  />
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                    onClick={() => setExpandedQuestionId(isQExpanded ? null : q.id)}
                  >
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{q.question_code}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {formatLabels[q.question_format] || q.question_format}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">{q.item_count}문항</span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {stripHtml(q.title || q.content)}
                    </span>
                    {isQExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                </div>
                {isQExpanded && (
                  <div className="px-2.5 pb-2.5">
                    <QuestionDetailPreview
                      question={{
                        question_format: q.question_format,
                        content: q.content,
                        instructions: q.instructions,
                        options_data: q.options_data,
                        answer_data: q.answer_data,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            추가 가능한 문제가 없습니다.
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-muted/20 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{availableQuestions.length}개 사용 가능</p>
          {selectedForAdd.length > 0 && addDrawerGroupId && (
            <Button
              size="sm"
              onClick={() => {
                onAddQuestions();
                onClose();
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              {selectedForAdd.length}개 추가
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onCreateQuestion}
        >
          <Plus className="mr-1 h-4 w-4" />
          새 문제 만들기
        </Button>
      </div>
    </div>
  );
}
