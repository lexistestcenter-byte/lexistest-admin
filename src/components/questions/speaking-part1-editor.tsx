"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FileUpload } from "@/components/ui/file-upload";
import type { SpeakingSubQ } from "./types";

export function SpeakingPart1Editor({
  questions,
  setQuestions,
}: {
  questions: SpeakingSubQ[];
  setQuestions: (v: SpeakingSubQ[]) => void;
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const filledCount = questions.filter((q) => q.text.trim()).length;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getTextPreview = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length > 40 ? text.slice(0, 40) + "..." : text || "비어있음";
  };

  const updateSubQ = (id: string, updates: Partial<SpeakingSubQ>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addSubQ = () => {
    const newId = `sq-${Date.now()}`;
    setQuestions([...questions, { id: newId, text: "", timeLimitSeconds: "30", allowResponseReset: true, audioUrl: "", audioFile: null }]);
    setExpandedCards((prev) => new Set(prev).add(newId));
  };

  const removeSubQ = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
    setExpandedCards((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="font-medium text-emerald-900">Part 1: Interview</p>
        <p className="text-sm text-emerald-700 mt-1">일상적인 주제에 대한 짧은 질문 그룹. 각 질문별로 시간 제한과 설정을 지정합니다.</p>
      </div>

      {/* Question count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filledCount}</span> / {questions.length} 질문 입력됨
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const allIds = questions.map((q) => q.id);
              const allExpanded = allIds.every((id) => expandedCards.has(id));
              setExpandedCards(allExpanded ? new Set() : new Set(allIds));
            }}
          >
            {questions.every((q) => expandedCards.has(q.id)) ? "모두 접기" : "모두 펼치기"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={addSubQ}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            질문 추가
          </Button>
        </div>
      </div>

      {/* Question grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {questions.map((sq, idx) => {
          const isExpanded = expandedCards.has(sq.id);
          return (
            <div key={sq.id} className={cn("border border-emerald-200 rounded-lg overflow-hidden", isExpanded && "col-span-2")}>
              {/* Clickable header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-emerald-50 hover:bg-emerald-100 cursor-pointer select-none"
                onClick={() => toggleCard(sq.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  <span className="text-xs font-semibold text-emerald-700 shrink-0">Q{idx + 1}</span>
                  {!isExpanded && <span className="text-xs text-muted-foreground truncate">{getTextPreview(sq.text)}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isExpanded && (
                    <>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] text-muted-foreground">시간:</Label>
                        <Input
                          type="text" inputMode="numeric" maxLength={3}
                          className="h-6 w-14 text-[11px] text-center"
                          value={sq.timeLimitSeconds}
                          onChange={(e) => { const val = e.target.value; if (val === "" || /^\d{1,3}$/.test(val)) updateSubQ(sq.id, { timeLimitSeconds: val }); }}
                          placeholder="30"
                        />
                        <span className="text-[10px] text-muted-foreground">초</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] text-muted-foreground">재녹음:</Label>
                        <input type="checkbox" checked={sq.allowResponseReset} onChange={(e) => updateSubQ(sq.id, { allowResponseReset: e.target.checked })} className="h-3.5 w-3.5" />
                      </div>
                    </>
                  )}
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSubQ(sq.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Body - only when expanded */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  <RichTextEditor
                    value={sq.text}
                    onChange={(v) => updateSubQ(sq.id, { text: v })}
                    placeholder={`Q${idx + 1}: e.g. What do you do in your free time?`}
                    minHeight="60px"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">오디오:</Label>
                    <div className="flex-1">
                      <FileUpload
                        value={sq.audioUrl}
                        onChange={(v) => updateSubQ(sq.id, { audioUrl: v })}
                        accept="audio"
                        placeholder="시험관 오디오 업로드 (선택)"
                        deferred
                        onFileReady={(file) => updateSubQ(sq.id, { audioFile: file })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
