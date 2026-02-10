"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export function WritingEditor({
  title,
  setTitle,
  condition,
  setCondition,
  prompt,
  setPrompt,
  minWords,
  setMinWords,
  disabled,
}: {
  title: string;
  setTitle: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  minWords: string;
  setMinWords: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* 타입 안내 */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>IELTS Writing</strong>: Task 1은 그래프/차트 이미지와 함께 최소 150단어, Task 2는 에세이 주제만으로 최소 250단어가 일반적입니다.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>제목 <span className="text-red-500">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: WRITING TASK 1"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>최소 단어 수 <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={minWords}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^[1-9]\d{0,3}$/.test(val)) {
                setMinWords(val);
              }
            }}
            placeholder="예: 150 또는 250"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Task 1: 150, Task 2: 250이 일반적
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>조건 (선택)</Label>
        <Input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="예: You should spend about 20 minutes on this task."
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>작문 주제 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">Ctrl+B: 굵게</p>
        </div>
        <RichTextEditor
          value={prompt}
          onChange={setPrompt}
          placeholder="작문 주제를 입력하세요"
          minHeight="200px"
        />
      </div>
    </div>
  );
}
