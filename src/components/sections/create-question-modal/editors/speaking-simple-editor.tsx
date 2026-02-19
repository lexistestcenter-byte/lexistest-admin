"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronDown, ChevronRight, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { getCdnUrl } from "@/lib/cdn";
import type { TabState, SpeakingSubQuestion } from "../types";
import { createSpeakingSubQuestion } from "../types";

interface ModalSpeakingSimpleEditorProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
  expandedSpeakingCards: Set<string>;
  setExpandedSpeakingCards: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  toggleSpeakingCard: (id: string) => void;
}

export function ModalSpeakingSimpleEditor({
  tab, updateTab,
  expandedSpeakingCards, setExpandedSpeakingCards, toggleSpeakingCard,
}: ModalSpeakingSimpleEditorProps) {
  const isPart1 = tab.selectedFormat === "speaking_part1";
  const isPart3 = tab.selectedFormat === "speaking_part3";

  const updateSubQuestion = (id: string, updates: Partial<SpeakingSubQuestion>) => {
    updateTab({
      speakingQuestions: tab.speakingQuestions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  };

  const addSubQuestion = () => {
    const newQ = createSpeakingSubQuestion();
    updateTab({
      speakingQuestions: [...tab.speakingQuestions, newQ],
    });
    setExpandedSpeakingCards((prev: Set<string>) => new Set(prev).add(newQ.id));
  };

  const removeSubQuestion = (id: string) => {
    if (tab.speakingQuestions.length <= 1) return;
    updateTab({
      speakingQuestions: tab.speakingQuestions.filter((q) => q.id !== id),
    });
    setExpandedSpeakingCards((prev: Set<string>) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const filledCount = tab.speakingQuestions.filter((q) => q.text.replace(/<[^>]*>/g, "").trim()).length;

  return (
    <div className="space-y-6">
      {isPart1 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="font-medium text-emerald-900">Part 1: Interview</p>
          <p className="text-sm text-emerald-700 mt-1">
            일상적인 주제에 대한 짧은 질문 그룹. 각 질문별로 시간 제한과 설정을 지정합니다.
          </p>
        </div>
      )}

      {isPart3 && (
        <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <p className="font-medium text-violet-900">Part 3: Discussion</p>
          <p className="text-sm text-violet-700 mt-1">
            Part 2 주제와 관련된 추상적이고 심화된 질문 그룹
          </p>
        </div>
      )}

      {/* Question count summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filledCount}</span> / {tab.speakingQuestions.length} 질문 입력됨
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const allIds = tab.speakingQuestions.map((q) => q.id);
              const allExpanded = allIds.every((id) => expandedSpeakingCards.has(id));
              setExpandedSpeakingCards(allExpanded ? new Set() : new Set(allIds));
            }}
          >
            {tab.speakingQuestions.every((q) => expandedSpeakingCards.has(q.id)) ? "모두 접기" : "모두 펼치기"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={addSubQuestion}
            disabled={tab.saved}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            질문 추가
          </Button>
        </div>
      </div>

      {/* Question list */}
      <div className="flex flex-col gap-3">
        {tab.speakingQuestions.map((sq, idx) => {
          const isExpanded = expandedSpeakingCards.has(sq.id);
          return (
            <div
              key={sq.id}
              className={cn(
                "border rounded-lg overflow-hidden",
                isPart1 ? "border-emerald-200" : "border-violet-200",
              )}
            >
              {/* Main area - always visible */}
              <div className={cn("px-3 py-2", isPart1 ? "bg-emerald-50" : "bg-violet-50")}>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-semibold shrink-0",
                    isPart1 ? "text-emerald-700" : "text-violet-700"
                  )}>
                    Q{idx + 1}
                  </span>
                  <Input
                    className={cn(
                      "flex-1 h-7 text-sm bg-white border border-gray-200 rounded px-2",
                      isPart1 ? "focus-visible:ring-1 focus-visible:ring-emerald-300 focus-visible:border-emerald-300" : "focus-visible:ring-1 focus-visible:ring-violet-300 focus-visible:border-violet-300"
                    )}
                    value={sq.text.replace(/<[^>]*>/g, "")}
                    onChange={(e) => updateSubQuestion(sq.id, { text: e.target.value })}
                    placeholder={isPart3
                      ? "e.g. Why do you think some people prefer..."
                      : "e.g. What do you do in your free time?"}
                    disabled={tab.saved}
                  />
                  {sq.audioUrl && <AudioPlayButton src={sq.audioUrl} />}
                  <button
                    type="button"
                    onClick={() => toggleSpeakingCard(sq.id)}
                    className="p-1 rounded hover:bg-black/5 shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className={cn("h-3.5 w-3.5", isPart1 ? "text-emerald-600" : "text-violet-600")} />
                    ) : (
                      <ChevronRight className={cn("h-3.5 w-3.5", isPart1 ? "text-emerald-600" : "text-violet-600")} />
                    )}
                  </button>
                  {tab.speakingQuestions.length > 1 && !tab.saved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeSubQuestion(sq.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded area - settings + audio upload */}
              {isExpanded && (
                <div className="px-3 py-2 border-t flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">시간:</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      className="h-6 w-14 text-[11px] text-center"
                      value={sq.timeLimitSeconds}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d{1,3}$/.test(val)) updateSubQuestion(sq.id, { timeLimitSeconds: val });
                      }}
                      placeholder="30"
                      disabled={tab.saved}
                    />
                    <span className="text-[10px] text-muted-foreground">초</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">재녹음:</Label>
                    <Switch
                      checked={sq.allowResponseReset}
                      onCheckedChange={(v) => updateSubQuestion(sq.id, { allowResponseReset: v })}
                      disabled={tab.saved}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <Label className="text-xs text-muted-foreground shrink-0">오디오:</Label>
                    <FileUpload
                      value={sq.audioUrl}
                      onChange={() => {}}
                      accept="audio"
                      placeholder="시험관 오디오 (선택)"
                      deferred
                      onFileReady={(file) => {
                        if (file) {
                          updateSubQuestion(sq.id, { audioUrl: URL.createObjectURL(file), audioFile: file });
                        } else {
                          updateSubQuestion(sq.id, { audioUrl: "", audioFile: null });
                        }
                      }}
                      compact
                    />
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

function AudioPlayButton({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(getCdnUrl(src));
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <button type="button" onClick={toggle} className="p-1 rounded hover:bg-black/5 shrink-0" title={playing ? "정지" : "재생"}>
      {playing
        ? <Square className="h-3.5 w-3.5 text-red-500 fill-red-500" />
        : <Play className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
      }
    </button>
  );
}
