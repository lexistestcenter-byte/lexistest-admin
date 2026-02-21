"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ShortAnswerEditorProps {
  question: string;
  setQuestion: (v: string) => void;
  answer: string;
  setAnswer: (v: string) => void;
  alternatives: string[];
  setAlternatives: (v: string[]) => void;
  disabled?: boolean;
}

export function ShortAnswerEditor({ question, setQuestion, answer, setAnswer, alternatives, setAlternatives, disabled }: ShortAnswerEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">질문 <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="예: What is the main purpose of the study?"
          minHeight="80px"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">정답 <span className="text-red-500">*</span></Label>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="정답 입력"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">대체 정답</Label>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAlternatives([...alternatives, ""])}
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
        {alternatives.map((alt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={alt}
              onChange={(e) => {
                const alts = [...alternatives];
                alts[i] = e.target.value;
                setAlternatives(alts);
              }}
              placeholder={`대체 정답 ${i + 1}`}
              className="h-8 text-sm"
              disabled={disabled}
            />
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setAlternatives(alternatives.filter((_, idx) => idx !== i))}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {alternatives.length === 0 && (
          <p className="text-xs text-muted-foreground">대체 정답이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
