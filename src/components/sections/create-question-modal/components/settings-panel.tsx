"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import type { QuestionType } from "@/components/questions/types";
import type { TabState } from "../types";

interface SettingsPanelProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
  questionType: QuestionType;
  toggleMcqMode: (isMultiple: boolean) => void;
  correctCount: number;
  part2Questions: { id: string; question_code: string; topic: string }[];
  isLoadingSpeakingData: boolean;
}

export function SettingsPanel({
  tab, updateTab, questionType,
  toggleMcqMode, correctCount,
  part2Questions, isLoadingSpeakingData,
}: SettingsPanelProps) {
  const fmt = tab.selectedFormat!;
  const isSpeaking = fmt === "speaking_part1" || fmt === "speaking_part2" || fmt === "speaking_part3";
  const isListening = questionType === "listening";
  const hasSeparateNumbers =
    fmt === "true_false_ng" || fmt === "matching" || fmt === "fill_blank_typing" ||
    fmt === "fill_blank_drag" || fmt === "table_completion" || fmt === "flowchart" ||
    fmt === "map_labeling" || (fmt === "mcq" && tab.mcqIsMultiple);
  const hasFillBlankMode = fmt === "fill_blank_typing" || fmt === "fill_blank_drag";
  const hasWordBank = fmt === "fill_blank_drag";

  return (
    <div className="space-y-5">
      {/* ─── Basic Settings ─── */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{isSpeaking ? "Basic Settings" : "기본 설정"}</h4>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{isSpeaking ? "Practice Question" : "연습문제"}</Label>
          <Switch checked={tab.isPractice} onCheckedChange={(v) => updateTab({ isPractice: v })} disabled={tab.saved} />
        </div>
        {hasSeparateNumbers && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">별도 문항 번호</Label>
              <Switch
                checked={fmt === "mcq" ? tab.mcqSeparateNumbers : tab.separateNumbers}
                onCheckedChange={(v) => updateTab(fmt === "mcq" ? { mcqSeparateNumbers: v } : { separateNumbers: v })}
                disabled={tab.saved}
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {(fmt === "mcq" ? tab.mcqSeparateNumbers : tab.separateNumbers)
                ? "각 항목이 별도 문항 번호를 차지합니다"
                : "하나의 문항으로 처리됩니다"}
            </p>
          </div>
        )}
      </div>

      {/* ─── Audio (listening / speaking Part 2) ─── */}
      {(isListening || fmt === "speaking_part2") && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {fmt === "speaking_part2" ? "Examiner Audio" : "Audio"}
          </h4>
          <p className="text-[10px] text-muted-foreground">
            {fmt === "speaking_part2" ? "Upload the examiner's recorded question audio" : "Upload audio file"}
          </p>
          <FileUpload
            value={tab.audioUrl}
            onChange={(v) => updateTab({ audioUrl: v })}
            accept="audio"
            placeholder={fmt === "speaking_part2" ? "Upload examiner audio" : "Upload audio file"}
            deferred
            onFileReady={(file) => updateTab({ audioFile: file })}
          />
        </div>
      )}

      {/* ─── MCQ 선택 설정 ─── */}
      {fmt === "mcq" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">선택 방식</h4>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => toggleMcqMode(false)}
              disabled={tab.saved}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${!tab.mcqIsMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"}`}
            >
              단일선택 (라디오)
            </button>
            <button
              onClick={() => toggleMcqMode(true)}
              disabled={tab.saved}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${tab.mcqIsMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"}`}
            >
              복수선택 (체크박스)
            </button>
          </div>
          {tab.mcqIsMultiple && (
            <div className="space-y-1">
              <Label className="text-xs">정답 개수</Label>
              <Select value={tab.mcqMaxSelections.toString()} onValueChange={(v) => updateTab({ mcqMaxSelections: parseInt(v) })} disabled={tab.saved}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.max(0, tab.mcqOptions.length - 1) }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}개</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">현재 {correctCount}개 선택됨</p>
            </div>
          )}
        </div>
      )}

      {/* ─── 빈칸 모드 (fill_blank) ─── */}
      {hasFillBlankMode && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">빈칸 설정</h4>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${tab.blankMode === "word" ? "text-primary" : "text-muted-foreground"}`}>워드형</span>
            <Switch
              checked={tab.blankMode === "sentence"}
              disabled={tab.saved}
              onCheckedChange={(checked) => {
                const newMode = checked ? "sentence" : "word";
                if (tab.fillContent.trim() || tab.blanks.length > 0) {
                  updateTab({ fillContent: "", blanks: [], wordBank: tab.selectedFormat === "fill_blank_drag" ? [] : tab.wordBank, blankMode: newMode });
                  toast.info("모드가 변경되어 내용이 초기화되었습니다");
                } else {
                  updateTab({ blankMode: newMode });
                }
              }}
            />
            <span className={`text-xs font-medium ${tab.blankMode === "sentence" ? "text-primary" : "text-muted-foreground"}`}>문장형</span>
          </div>
          {fmt === "fill_blank_drag" && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">중복 단어 허용</Label>
              <Switch checked={tab.fillBlankDragAllowDuplicate} onCheckedChange={(v) => updateTab({ fillBlankDragAllowDuplicate: v })} disabled={tab.saved} />
            </div>
          )}
        </div>
      )}

      {/* ─── Matching 설정 ─── */}
      {fmt === "matching" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">매칭 설정</h4>
          <div className="flex items-center justify-between">
            <Label className="text-xs">같은 제목 중복 사용 허용</Label>
            <Switch checked={tab.matchingAllowDuplicate} onCheckedChange={(v) => updateTab({ matchingAllowDuplicate: v })} disabled={tab.saved} />
          </div>
        </div>
      )}

      {/* ─── Word Bank (fill_blank_drag) ─── */}
      {hasWordBank && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Word Bank</h4>
          <div className="flex flex-wrap gap-1">
            {tab.wordBank.map((w, i) => (
              <Badge key={i} variant="secondary" className="gap-1 text-[10px]">
                {w}
                {!tab.saved && (
                  <button onClick={() => updateTab({ wordBank: tab.wordBank.filter((_, idx) => idx !== i) })}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {!tab.saved && (
            <div className="flex gap-1">
              <Input
                value={tab.newWord}
                onChange={(e) => updateTab({ newWord: e.target.value })}
                placeholder="함정 단어 입력"
                className="flex-1 h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tab.newWord.trim()) {
                    e.preventDefault();
                    if (tab.wordBank.includes(tab.newWord.trim())) { toast.warning("이미 존재하는 단어입니다."); return; }
                    updateTab({ wordBank: [...tab.wordBank, tab.newWord.trim()], newWord: "" });
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={() => {
                  if (tab.newWord.trim()) {
                    if (tab.wordBank.includes(tab.newWord.trim())) { toast.warning("이미 존재하는 단어입니다."); return; }
                    updateTab({ wordBank: [...tab.wordBank, tab.newWord.trim()], newWord: "" });
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Speaking Settings ─── */}
      {fmt === "speaking_part2" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Speaking Settings</h4>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">AI Follow-up Questions</Label>
              <p className="text-[10px] text-muted-foreground">Generate AI follow-up after Part 2</p>
            </div>
            <Switch checked={tab.generateFollowup} onCheckedChange={(v) => updateTab({ generateFollowup: v })} disabled={tab.saved} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preparation Time (seconds)</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="h-8 text-xs"
              value={tab.prepTimeSeconds}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d{1,3}$/.test(val)) updateTab({ prepTimeSeconds: val });
              }}
              placeholder="60"
              disabled={tab.saved}
            />
            <p className="text-[10px] text-muted-foreground">Default: 60 seconds</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Speaking Time (seconds)</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="h-8 text-xs"
              value={tab.speakingTimeSeconds}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d{1,3}$/.test(val)) updateTab({ speakingTimeSeconds: val });
              }}
              placeholder="120"
              disabled={tab.saved}
            />
            <p className="text-[10px] text-muted-foreground">Default: 120 seconds</p>
          </div>
        </div>
      )}

      {fmt === "speaking_part3" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Speaking Settings</h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Related Part 2 Question</Label>
            <Select value={tab.relatedPart2Id} onValueChange={(v) => updateTab({ relatedPart2Id: v })} disabled={isLoadingSpeakingData || tab.saved}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={isLoadingSpeakingData ? "Loading..." : "Select Part 2 question"} />
              </SelectTrigger>
              <SelectContent>
                {part2Questions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    [{q.question_code}] {q.topic.slice(0, 40)}{q.topic.length > 40 ? "..." : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tab.relatedPart2Id && (
              <p className="text-[10px] text-muted-foreground leading-tight">
                {part2Questions.find(q => q.id === tab.relatedPart2Id)?.topic}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Depth Level</Label>
            <Select value={String(tab.depthLevel)} onValueChange={(v) => updateTab({ depthLevel: Number(v) as 1 | 2 | 3 })} disabled={tab.saved}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level 1 (Basic)</SelectItem>
                <SelectItem value="2">Level 2 (Intermediate)</SelectItem>
                <SelectItem value="3">Level 3 (Advanced)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ─── Response Settings (Part 2 only) ─── */}
      {fmt === "speaking_part2" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Settings</h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Time Limit (seconds)</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="h-8 text-xs"
              value={tab.timeLimitSeconds}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d{1,3}$/.test(val)) updateTab({ timeLimitSeconds: val });
              }}
              placeholder="e.g. 30"
              disabled={tab.saved}
            />
            <p className="text-[10px] text-muted-foreground">Max response time</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Allow Re-recording</Label>
              <p className="text-[10px] text-muted-foreground">Let students re-record their response</p>
            </div>
            <Switch checked={tab.allowResponseReset} onCheckedChange={(v) => updateTab({ allowResponseReset: v })} disabled={tab.saved} />
          </div>
        </div>
      )}
    </div>
  );
}
