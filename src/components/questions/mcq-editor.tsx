"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { MCQOption } from "@/components/questions/types";

export function MCQEditor({
  question,
  setQuestion,
  options,
  addOption,
  removeOption,
  updateOption,
  toggleCorrect,
  isMultiple,
  setIsMultiple,
  maxSelections,
  setMaxSelections,
  disabled,
}: {
  question: string;
  setQuestion: (v: string) => void;
  options: MCQOption[];
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, field: keyof MCQOption, value: unknown) => void;
  toggleCorrect: (id: string) => void;
  isMultiple: boolean;
  setIsMultiple: (v: boolean) => void;
  maxSelections: number;
  setMaxSelections: (v: number) => void;
  disabled?: boolean;
}) {
  const correctCount = options.filter(o => o.isCorrect).length;

  return (
    <div className="space-y-6">
      {/* 모드 선택 */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">선택 방식:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMultiple(false)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
                }`}
            >
              단일선택 (라디오)
            </button>
            <button
              onClick={() => setIsMultiple(true)}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
                }`}
            >
              복수선택 (체크박스)
            </button>
          </div>
        </div>
        {isMultiple && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">정답 개수:</Label>
            <Select value={maxSelections.toString()} onValueChange={(v) => setMaxSelections(parseInt(v))}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.max(0, options.length - 1) }, (_, i) => i + 2).map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}개</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">(현재 {correctCount}개 선택됨)</span>
          </div>
        )}
      </div>

      {/* 문제 */}
      <div className="space-y-2">
        <Label>문제 <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="문제를 입력하세요"
          minHeight="80px"
        />
      </div>

      {/* 선택지 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>선택지 <span className="text-red-500">*</span></Label>
          <Button variant="outline" size="sm" onClick={addOption} disabled={disabled}>
            <Plus className="h-4 w-4 mr-1" />
            선택지 추가
          </Button>
        </div>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleCorrect(option.id)}
              disabled={disabled}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold transition-colors ${option.isCorrect
                ? "bg-green-500 border-green-500 text-white"
                : "border-slate-300 hover:border-primary"
                }`}
            >
              {option.label}
            </button>
            <Input
              className="flex-1"
              value={option.text}
              onChange={(e) => updateOption(option.id, "text", e.target.value)}
              placeholder={`선택지 ${option.label}`}
              disabled={disabled}
            />
            {options.length > 2 && !disabled && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          {isMultiple
            ? `정답을 ${maxSelections}개 선택하세요 (클릭하여 토글)`
            : "정답을 클릭하세요 (하나만 선택 가능)"}
        </p>
      </div>
    </div>
  );
}
