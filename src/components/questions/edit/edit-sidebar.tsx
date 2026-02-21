"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import type { QuestionType, QuestionFormat, Blank } from "@/components/questions/types";

export function EditSidebar({
  selectedQuestionType,
  selectedFormat,
  isPractice,
  setIsPractice,
  separateNumbers,
  setSeparateNumbers,
  mcqIsMultiple,
  mcqDisplayAlphabet,
  setMcqDisplayAlphabet,
  audioUrl,
  setAudioUrl,
  questionCode,
  blanks,
  wordBank,
  tableInputMode,
  generateFollowup,
  setGenerateFollowup,
  bankLabel,
  setBankLabel,
  bankLayout,
  setBankLayout,
  addWord,
  updateWord,
  removeWord,
}: {
  selectedQuestionType: QuestionType;
  selectedFormat: QuestionFormat;
  isPractice: boolean;
  setIsPractice: (v: boolean) => void;
  separateNumbers: boolean;
  setSeparateNumbers: (v: boolean) => void;
  mcqIsMultiple: boolean;
  mcqDisplayAlphabet: boolean;
  setMcqDisplayAlphabet: (v: boolean) => void;
  audioUrl: string;
  setAudioUrl: (v: string) => void;
  questionCode: string;
  blanks: Blank[];
  wordBank: string[];
  tableInputMode: "typing" | "drag";
  generateFollowup: boolean;
  setGenerateFollowup: (v: boolean) => void;
  bankLabel: string;
  setBankLabel: (v: string) => void;
  bankLayout: "row" | "column";
  setBankLayout: (v: "row" | "column") => void;
  addWord: () => void;
  updateWord: (index: number, value: string) => void;
  removeWord: (index: number) => void;
}) {
  return (
    <div className="w-80 border-r bg-slate-50 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 기본 설정 */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">기본 설정</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">연습 문제</Label>
              <p className="text-xs text-muted-foreground">실전 시험이 아닌 연습용</p>
            </div>
            <Switch
              checked={isPractice}
              onCheckedChange={setIsPractice}
            />
          </div>

          {/* 별도 문항 번호 토글 — multi-item 유형 공통 + MCQ 복수선택 */}
          {selectedFormat && ([
            "true_false_ng", "yes_no_ng", "matching", "heading_matching",
            "fill_blank_typing", "fill_blank_drag",
            "flowchart", "table_completion", "map_labeling",
          ].includes(selectedFormat) || (selectedFormat === "mcq" && mcqIsMultiple)) && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">별도 문항 번호 부여</Label>
                  <p className="text-xs text-muted-foreground">
                    {separateNumbers
                      ? "각 항목이 별도 문항 번호를 차지합니다 (예: Questions 5–8)"
                      : "하나의 문항으로 처리됩니다 (예: Question 5)"}
                  </p>
                </div>
                <Switch
                  checked={separateNumbers}
                  onCheckedChange={setSeparateNumbers}
                />
              </div>
            )}

          {/* MCQ 표시 방식: 알파벳 버튼 */}
          {selectedFormat === "mcq" && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">알파벳 버튼 표시</Label>
                <p className="text-xs text-muted-foreground">A, B, C 알파벳 버튼으로 표시</p>
              </div>
              <Switch
                checked={mcqDisplayAlphabet}
                onCheckedChange={setMcqDisplayAlphabet}
              />
            </div>
          )}
        </div>

        {/* Audio Settings (Listening & Speaking Part 2) */}
        {(selectedQuestionType === "listening" || selectedFormat === "speaking_part2") && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">오디오 설정</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">오디오 파일 (선택)</Label>
                <FileUpload
                  value={audioUrl}
                  onChange={setAudioUrl}
                  accept="audio"
                  context={questionCode ? `questions/${questionCode}` : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* Word Bank 표시 설정 (fill_blank_drag only) */}
        {selectedFormat === "fill_blank_drag" && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">보기 설정</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">보기 라벨명</Label>
              <Input
                className="h-7 text-xs"
                value={bankLabel}
                onChange={(e) => setBankLabel(e.target.value)}
                placeholder="Word Bank"
              />
              <p className="text-[10px] text-muted-foreground">비워두면 라벨 미표시</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">보기 배치</Label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setBankLayout("row")}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${bankLayout === "row" ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  가로 (Row)
                </button>
                <button
                  onClick={() => setBankLayout("column")}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${bankLayout === "column" ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  세로 (Column)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Word Bank (fill_blank_drag or table_completion drag) */}
        {(selectedFormat === "fill_blank_drag" || (selectedFormat === "table_completion" && tableInputMode === "drag")) && (
          <div className="space-y-3">
            <Label className="text-xs">Word Bank</Label>
            {/* 정답 단어 (자동) */}
            {blanks.filter(b => b.answer.trim()).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">정답 단어 (자동)</p>
                <div className="flex flex-wrap gap-1">
                  {blanks.filter(b => b.answer.trim()).map((b) => (
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
                {wordBank.filter(w => !blanks.some(b => b.answer === w)).length === 0 && blanks.length > 0 ? (
                  <p className="text-xs text-muted-foreground italic">함정 단어를 추가하세요</p>
                ) : null}
                {wordBank.map((word, i) => {
                  const isAutoWord = blanks.some(b => b.answer === word);
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
