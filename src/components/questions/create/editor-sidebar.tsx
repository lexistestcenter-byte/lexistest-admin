"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import type { QuestionType } from "@/components/questions/types";
import type { QuestionTab } from "./types";

export function EditorSidebar({
  currentTab,
  selectedQuestionType,
  updateCurrentTab,
  addWord,
  updateWord,
  removeWord,
}: {
  currentTab: QuestionTab;
  selectedQuestionType: QuestionType;
  updateCurrentTab: <K extends keyof QuestionTab>(field: K, value: QuestionTab[K]) => void;
  addWord: () => void;
  updateWord: (index: number, value: string) => void;
  removeWord: (index: number) => void;
}) {
  return (
    <div className="w-80 border-r bg-slate-50 overflow-y-auto">
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">기본 설정</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">연습 문제</Label>
              <p className="text-xs text-muted-foreground">실전 시험이 아닌 연습용</p>
            </div>
            <Switch
              checked={currentTab.isPractice}
              onCheckedChange={(v) => updateCurrentTab("isPractice", v)}
            />
          </div>

          {/* 별도 문항 번호 토글 — multi-item 유형 공통 */}
          {currentTab.format && [
            "true_false_ng", "yes_no_ng", "matching", "heading_matching",
            "fill_blank_typing", "fill_blank_drag",
            "flowchart", "table_completion", "map_labeling",
          ].includes(currentTab.format) && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">별도 문항 번호 부여</Label>
                <p className="text-xs text-muted-foreground">
                  {currentTab.separateNumbers
                    ? "각 항목이 별도 문항 번호를 차지합니다 (예: Questions 5–8)"
                    : "하나의 문항으로 처리됩니다 (예: Question 5)"}
                </p>
              </div>
              <Switch
                checked={currentTab.separateNumbers}
                onCheckedChange={(v) => updateCurrentTab("separateNumbers", v)}
              />
            </div>
          )}

          {/* 별도 문항 번호 토글 — MCQ 복수선택 */}
          {currentTab.format === "mcq" && currentTab.mcqIsMultiple && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">별도 문항 번호 부여</Label>
                <p className="text-xs text-muted-foreground">
                  {currentTab.mcqSeparateNumbers
                    ? `각 정답이 별도 문항 번호를 차지합니다 (예: Questions 5–${4 + currentTab.mcqMaxSelections})`
                    : "하나의 문항으로 처리됩니다 (예: Question 5)"}
                </p>
              </div>
              <Switch
                checked={currentTab.mcqSeparateNumbers}
                onCheckedChange={(v) => updateCurrentTab("mcqSeparateNumbers", v)}
              />
            </div>
          )}
        </div>

        {/* Audio Settings (Listening & Speaking Part 2) */}
        {(selectedQuestionType === "listening" || currentTab.format === "speaking_part2") && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">오디오 설정</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">오디오 파일 (선택)</Label>
                <FileUpload
                  value={currentTab.audioUrl}
                  onChange={(url) => updateCurrentTab("audioUrl", url)}
                  accept="audio"
                  deferred
                  onFileReady={(file) => updateCurrentTab("audioFile", file)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Word Bank 표시 설정 (fill_blank_drag only) */}
        {currentTab.format === "fill_blank_drag" && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">보기 설정</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">보기 라벨명</Label>
              <Input
                className="h-7 text-xs"
                value={currentTab.bankLabel}
                onChange={(e) => updateCurrentTab("bankLabel", e.target.value)}
                placeholder="Word Bank"
              />
              <p className="text-[10px] text-muted-foreground">비워두면 라벨 미표시</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">보기 배치</Label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateCurrentTab("bankLayout", "row")}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${currentTab.bankLayout === "row" ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  가로 (Row)
                </button>
                <button
                  onClick={() => updateCurrentTab("bankLayout", "column")}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${currentTab.bankLayout === "column" ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  세로 (Column)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Word Bank (fill_blank_drag or table_completion drag) */}
        {(currentTab.format === "fill_blank_drag" || (currentTab.format === "table_completion" && currentTab.tableInputMode === "drag")) && (
          <div className="space-y-3">
            <Label className="text-xs">Word Bank</Label>
            {/* 정답 단어 (자동) */}
            {currentTab.blanks.filter(b => b.answer.trim()).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">정답 단어 (자동)</p>
                <div className="flex flex-wrap gap-1">
                  {currentTab.blanks.filter(b => b.answer.trim()).map((b) => (
                    <span key={b.id} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded border border-primary/20">
                      {b.answer}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* 함정 단어 (수동) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">함정 단어 (수동)</p>
                <Button variant="ghost" size="sm" onClick={addWord} className="h-6 text-[10px] px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
              <div className="space-y-1.5">
                {currentTab.wordBank.filter(w => !currentTab.blanks.some(b => b.answer === w)).length === 0 && currentTab.wordBank.filter(w => currentTab.blanks.some(b => b.answer === w)).length === currentTab.wordBank.length && currentTab.blanks.length > 0 ? (
                  <p className="text-xs text-muted-foreground italic">함정 단어를 추가하세요</p>
                ) : null}
                {currentTab.wordBank.map((word, i) => {
                  const isAutoWord = currentTab.blanks.some(b => b.answer === word);
                  if (isAutoWord) return null;
                  return (
                    <div key={i} className="flex gap-1.5">
                      <Input
                        className="h-7 text-xs"
                        value={word}
                        onChange={(e) => updateWord(i, e.target.value)}
                        placeholder={`함정 단어`}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeWord(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
