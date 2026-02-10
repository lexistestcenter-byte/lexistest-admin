"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Switch } from "@/components/ui/switch";
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
  question, setQuestion, options, addOption, removeOption, updateOption, toggleCorrect,
  isMultiple, setIsMultiple, maxSelections, setMaxSelections
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
}) {
  const correctCount = options.filter(o => o.isCorrect).length;
  // 선택지 개수에 따라 정답 개수 옵션 제한
  const maxSelectableCount = Math.min(options.length, 5);

  return (
    <div className="space-y-6">
      {/* 단일/복수 선택 모드 스위치 */}
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">복수 선택 모드</Label>
            <p className="text-sm text-muted-foreground">
              {isMultiple ? "여러 개의 정답을 선택할 수 있습니다" : "하나의 정답만 선택할 수 있습니다"}
            </p>
          </div>
          <Switch
            checked={isMultiple}
            onCheckedChange={setIsMultiple}
          />
        </div>
      </div>

      {isMultiple && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4">
            <Label className="text-sm">정답 개수:</Label>
            <Select value={maxSelections.toString()} onValueChange={(v) => setMaxSelections(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxSelectableCount - 1 }, (_, i) => i + 2).map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}개</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">(현재 선택: {correctCount}개)</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <RequiredLabel required>문제</RequiredLabel>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="예: Which TWO of the following statements are true?"
          minHeight="80px"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <RequiredLabel required>선택지</RequiredLabel>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="mr-2 h-4 w-4" />
            선택지 추가
          </Button>
        </div>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 flex items-center justify-center font-medium cursor-pointer transition-all ${isMultiple
                ? `rounded border-2 ${option.isCorrect ? "border-green-500 bg-green-500 text-white" : "border-slate-300 hover:border-primary"}`
                : `rounded-full border-2 ${option.isCorrect ? "border-green-500 bg-green-500 text-white ring-2 ring-green-200" : "border-slate-300 hover:border-primary hover:bg-primary/10"}`
                }`}
              onClick={() => toggleCorrect(option.id)}
            >
              {option.label}
            </div>
            <Input
              value={option.text}
              onChange={(e) => updateOption(option.id, "text", e.target.value)}
              placeholder={`선택지 ${option.label}`}
              className="flex-1"
            />
            {option.isCorrect && <span className="text-xs text-green-600 font-medium">정답</span>}
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
