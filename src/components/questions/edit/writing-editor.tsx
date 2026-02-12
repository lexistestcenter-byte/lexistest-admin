"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export function WritingEditor({
  title, setTitle,
  condition, setCondition,
  prompt, setPrompt,
  minWords, setMinWords,
}: {
  title: string;
  setTitle: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  minWords: string;
  setMinWords: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 타입 안내 */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>IELTS Writing</strong>: Task 1은 그래프/차트 이미지와 함께 최소 150단어, Task 2는 에세이 주제만으로 최소 250단어가 일반적입니다.
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 타이틀 */}
        <div className="space-y-2">
          <RequiredLabel required>타이틀</RequiredLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: Academic Writing Task 1"
          />
        </div>

        {/* 최소 단어 수 */}
        <div className="space-y-2">
          <RequiredLabel required>최소 단어 수</RequiredLabel>
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
          />
          <p className="text-xs text-muted-foreground">
            Task 1: 150, Task 2: 250이 일반적
          </p>
        </div>
      </div>

      {/* 조건 (선택) */}
      <div className="space-y-2">
        <Label>조건 (선택)</Label>
        <Input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="예: You should spend about 20 minutes on this task. Write at least 150 words."
        />
      </div>

      {/* 지문/프롬프트 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <RequiredLabel required>지문</RequiredLabel>
          <p className="text-xs text-muted-foreground">Ctrl+B: 굵게</p>
        </div>
        <RichTextEditor
          value={prompt}
          onChange={setPrompt}
          placeholder="예: The chart below shows the number of trips made by children..."
          minHeight="200px"
        />
      </div>
    </div>
  );
}
