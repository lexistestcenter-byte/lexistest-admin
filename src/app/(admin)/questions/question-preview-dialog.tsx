"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCdnUrl } from "@/lib/cdn";

// ─── Types ───────────────────────────────────────────────────────

interface QuestionData {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
  item_count: number;
  image_url?: string | null;
  is_practice: boolean;
  is_active: boolean;
  difficulty: string | null;
  audio_url?: string | null;
  audio_transcript?: string | null;
  speaking_category?: string | null;
  related_part2_id?: string | null;
  related_part2_code?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
}

interface QuestionPreviewDialogProps {
  questionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMAT_LABELS: Record<string, string> = {
  mcq_multiple: "복수선택",
  mcq_single: "단일선택",
  fill_blank_typing: "빈칸(입력)",
  fill_blank_drag: "빈칸(드래그)",
  true_false_ng: "T/F/NG",
  heading_matching: "제목매칭",
  matching: "매칭",
  flowchart: "플로우차트",
  table_completion: "테이블",
  map_labeling: "지도라벨링",
  essay_task1: "Task 1",
  essay_task2: "Task 2",
  essay: "에세이",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

const TYPE_COLORS: Record<string, string> = {
  reading: "bg-emerald-100 text-emerald-700",
  listening: "bg-sky-100 text-sky-700",
  writing: "bg-amber-100 text-amber-700",
  speaking: "bg-violet-100 text-violet-700",
};

export function QuestionPreviewDialog({
  questionId,
  open,
  onOpenChange,
}: QuestionPreviewDialogProps) {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !questionId) {
      setQuestion(null);
      return;
    }

    const fetchQuestion = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/questions/${questionId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setQuestion(data.question || null);
      } catch (err) {
        console.error("Failed to load question:", err);
        setQuestion(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [open, questionId]);

  // [숫자] 형식을 빈칸 UI로 변환
  const renderContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/\[(\d+)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const num = parseInt(part);
        return (
          <span key={index} className="inline-flex items-center mx-1">
            <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center">
              {num}
            </span>
            <span className="w-24 h-7 border-b-2 border-primary mx-1" />
          </span>
        );
      }
      return part.split("\n").map((line, i, arr) => (
        <span key={`${index}-${i}`}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  // ─── Fill Blank Typing ─────────────────────────────────────────
  const renderFillBlankTyping = (q: QuestionData) => {
    const od = q.options_data || {};
    const contentTitle = String(od.title || q.title || "");
    const inputStyle = String(od.input_style || "editor");
    const items = Array.isArray(od.items) ? od.items.map(String) : [];

    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        {contentTitle && (
          <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>
        )}
        {inputStyle === "items" && items.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5">
            {items.filter((i) => i.trim()).map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderContent(item)}
              </li>
            ))}
          </ul>
        ) : (
          <div className="leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_strong]:font-bold">
            {renderContent(q.content || "")}
          </div>
        )}
      </div>
    );
  };

  // ─── Fill Blank Drag ───────────────────────────────────────────
  const renderFillBlankDrag = (q: QuestionData) => {
    const od = q.options_data || {};
    const ad = q.answer_data || {};
    const contentTitle = String(od.title || q.title || "");
    const wordBank = Array.isArray(od.word_bank) ? od.word_bank.map(String) : [];
    const inputStyle = String(od.input_style || "editor");
    const items = Array.isArray(od.items) ? od.items.map(String) : [];

    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        {contentTitle && (
          <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>
        )}
        {inputStyle === "items" && items.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5">
            {items.filter((i) => i.trim()).map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderContent(item)}
              </li>
            ))}
          </ul>
        ) : (
          <div className="leading-relaxed prose prose-sm max-w-none">
            {renderContent(q.content || "")}
          </div>
        )}
        {wordBank.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Word Bank</p>
            <div className="flex flex-wrap gap-2">
              {wordBank.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="px-4 py-1.5 bg-white rounded border border-slate-300 text-sm cursor-grab hover:bg-slate-50"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Table Completion ──────────────────────────────────────────
  const renderTableCompletion = (q: QuestionData) => {
    const od = q.options_data || {};
    const contentTitle = String(od.title || q.title || "");
    const inputMode = String(od.input_mode || "typing");
    const wordBank = Array.isArray(od.word_bank) ? od.word_bank.map(String) : [];

    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        {contentTitle && (
          <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>
        )}
        <div
          className="leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
          dangerouslySetInnerHTML={{
            __html: (q.content || "").replace(
              /\[(\d+)\]/g,
              '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:22px;height:22px;background:#6366f1;color:white;font-size:11px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">$1</span><span style="display:inline-block;width:80px;height:28px;border-bottom:2px solid #6366f1;"></span></span>'
            ),
          }}
        />
        {inputMode === "drag" && wordBank.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Word Bank</p>
            <div className="flex flex-wrap gap-2">
              {wordBank.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="px-4 py-1.5 bg-white rounded border border-slate-300 text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── MCQ ───────────────────────────────────────────────────────
  const renderMCQ = (q: QuestionData) => {
    const od = q.options_data || {};
    const isMultiple = q.question_format === "mcq_multiple";
    const maxSelections = Number(od.maxSelections || 1);
    const options = Array.isArray(od.options)
      ? od.options
      : [];

    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <p className="text-lg">{q.content || "(문제 입력)"}</p>
        {isMultiple && (
          <p className="text-sm text-blue-600">Choose {maxSelections} answers.</p>
        )}
        <div className="space-y-3 mt-4">
          {options.map((option: { id?: string; label?: string; text?: string }, idx: number) => (
            <label
              key={option.id || idx}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
            >
              <div
                className={`w-8 h-8 border-2 flex items-center justify-center ${
                  isMultiple ? "rounded" : "rounded-full"
                }`}
              >
                {option.label || String.fromCharCode(65 + idx)}
              </div>
              <span>{option.text || `(선택지 ${option.label || idx + 1})`}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  // ─── True/False/NG ─────────────────────────────────────────────
  const renderTFNG = (q: QuestionData) => {
    const od = q.options_data || {};
    const items = Array.isArray(od.items) ? od.items : [];

    if (items.length === 0) {
      return (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="p-4 border rounded-lg">
            <p className="mb-4">{q.content || "(진술문 입력)"}</p>
            <div className="flex gap-2">
              {["TRUE", "FALSE", "NOT GIVEN"].map((label) => (
                <span
                  key={label}
                  className="px-4 py-2 border rounded text-sm cursor-pointer hover:bg-slate-50"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border p-6 space-y-3">
        {items.map((item: { id?: string; statement?: string }, idx: number) => (
          <div key={item.id || idx} className="p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </span>
              <p className="flex-1">{item.statement || "(진술문)"}</p>
            </div>
            <div className="flex gap-2 mt-3 ml-9">
              {["TRUE", "FALSE", "NOT GIVEN"].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1.5 border rounded text-sm cursor-pointer hover:bg-slate-50"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Matching ──────────────────────────────────────────────────
  const renderMatching = (q: QuestionData) => {
    const od = q.options_data || {};
    const contentTitle = String(od.title || q.title || "");
    const options = Array.isArray(od.options) ? od.options : [];
    const items = Array.isArray(od.items) ? od.items : [];
    const allowDuplicate = Boolean(od.allowDuplicate);

    return (
      <div className="grid grid-cols-[1fr_340px] gap-6">
        {/* 왼쪽: 지문 */}
        <div className="bg-white rounded-lg border p-6">
          {contentTitle && <h2 className="text-lg font-bold mb-4">{contentTitle}</h2>}
          <div
            className="prose prose-sm max-w-none [&_p]:my-1 [&_strong]:font-bold"
            dangerouslySetInnerHTML={{
              __html: (q.content || "").replace(
                /\[(\d+)\]/g,
                '<div style="display:inline-block;border:2px solid #94a3b8;border-radius:4px;padding:2px 24px;margin:8px 0;font-weight:bold;text-align:center;min-width:80px;">$1</div>'
              ),
            }}
          />
        </div>
        {/* 오른쪽: 옵션 목록 */}
        <div className="bg-white rounded-lg border p-4 h-fit">
          <h3 className="font-semibold mb-1">List of Headings</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Choose the correct heading for each section.
          </p>
          {allowDuplicate && (
            <p className="text-xs text-blue-600 mb-3">
              * 같은 제목을 여러 번 사용할 수 있습니다
            </p>
          )}
          <div className="space-y-2">
            {options.map((option: { id?: string; label?: string; text?: string }, idx: number) => (
              <div
                key={option.id || idx}
                className="px-4 py-2.5 bg-slate-50 rounded-lg border cursor-grab hover:bg-slate-100"
              >
                <span className="font-semibold mr-2">{option.label || String.fromCharCode(65 + idx)}.</span>
                <span>{option.text || `(제목 입력)`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Flowchart ─────────────────────────────────────────────────
  const renderFlowchart = (q: QuestionData) => {
    const od = q.options_data || {};
    const contentTitle = String(od.title || q.title || "");
    const nodes = Array.isArray(od.nodes) ? od.nodes : [];

    // Group nodes by row
    const rowMap = new Map<number, typeof nodes>();
    for (const n of nodes) {
      const row = n.row ?? 0;
      if (!rowMap.has(row)) rowMap.set(row, []);
      rowMap.get(row)!.push(n);
    }
    for (const [, group] of rowMap) {
      group.sort((a: { col?: number }, b: { col?: number }) => (a.col ?? 0) - (b.col ?? 0));
    }
    const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

    return (
      <div className="bg-white rounded-lg border p-6">
        {contentTitle && (
          <h2 className="text-lg font-bold text-center mb-6">{contentTitle}</h2>
        )}
        <div className="flex flex-col items-center">
          {sortedRows.map((row, rowIndex) => {
            const group = rowMap.get(row)!;
            const isBranch = group.length > 1 || group[0]?.type === "branch";

            return (
              <div key={row}>
                {/* Connector from previous row */}
                {rowIndex > 0 && (
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-3 bg-slate-400" />
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-transparent border-t-slate-400" />
                    </div>
                  </div>
                )}

                {/* Branch split connector */}
                {isBranch && group.length > 1 && (
                  <div className="flex justify-center mb-1">
                    <div
                      className="flex items-end"
                      style={{ width: `${Math.min(group.length * 200, 600)}px` }}
                    >
                      {group.map((_: unknown, i: number) => (
                        <div key={i} className="flex-1 border-t-2 border-slate-400 h-0" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Node row */}
                {isBranch ? (
                  <div className="flex justify-center gap-3">
                    {group.map((node: { id?: string; label?: string; content?: string }) => (
                      <div
                        key={node.id}
                        className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50 min-w-[160px] text-center"
                      >
                        {node.label && (
                          <div className="font-semibold text-blue-700 mb-1 text-xs">
                            {node.label}
                          </div>
                        )}
                        <div className="text-sm">{renderContent(node.content || "")}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="p-4 rounded-lg border-2 border-slate-300 bg-slate-50 min-w-[200px] text-center">
                      <div className="text-sm">
                        {renderContent(group[0]?.content || "")}
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
  };

  // ─── Map Labeling ──────────────────────────────────────────────
  const renderMapLabeling = (q: QuestionData) => {
    const od = q.options_data || {};
    const imageUrl = getCdnUrl(String(od.image_url || q.image_url || ""));
    const items = Array.isArray(od.items) ? od.items : [];
    const labels = Array.isArray(od.labels)
      ? od.labels.map(String)
      : ["A", "B", "C", "D", "E", "F"];

    return (
      <div className="grid grid-cols-2 gap-6">
        {/* 왼쪽: 이미지 */}
        <div className="bg-white rounded-lg border p-4 flex items-center justify-center min-h-[300px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Map"
              className="max-w-full h-auto max-h-[400px] rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <p className="text-sm text-gray-400">이미지 없음</p>
          )}
        </div>

        {/* 오른쪽: 문항 테이블 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">항목</th>
                {labels.map((label) => (
                  <th key={label} className="px-2 py-2 text-center font-medium w-10">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: { id?: string; statement?: string }, idx: number) => (
                <tr key={item.id || idx} className="border-t">
                  <td className="px-3 py-2 font-bold">{idx + 1}</td>
                  <td className="px-3 py-2">{item.statement || ""}</td>
                  {labels.map((label) => (
                    <td key={label} className="px-1 py-2 text-center">
                      <div className="w-6 h-6 rounded border-2 border-gray-300 mx-auto cursor-pointer hover:border-gray-400" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── Essay (Writing) ───────────────────────────────────────────
  const renderEssay = (q: QuestionData) => {
    const od = q.options_data || {};
    const contentTitle = String(od.title || q.title || "");
    const condition = String(od.condition || "");
    const imageUrl = getCdnUrl(String(od.image_url || q.image_url || ""));
    const minWords = Number(od.min_words || 150);

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          {contentTitle && (
            <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>
          )}
          {imageUrl && (
            <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
              <img
                src={imageUrl}
                alt="Task image"
                className="max-w-full h-auto max-h-[300px] rounded"
              />
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{q.content}</p>
          </div>
          {condition && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <span className="font-medium text-amber-800">조건: </span>
              {condition}
            </div>
          )}
        </div>

        {/* 작성 영역 */}
        <div className="bg-white rounded-lg border p-6">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 min-h-[200px]">
            <p className="text-gray-400 text-sm">작성 영역 (미리보기)</p>
          </div>
          <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
            <span>최소 {minWords}단어</span>
            <span>0 / {minWords} words</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── Speaking ──────────────────────────────────────────────────
  const renderSpeaking = (q: QuestionData) => {
    const fmt = q.question_format;
    const od = q.options_data || {};

    const bandRange =
      q.target_band_min || q.target_band_max
        ? `Band ${q.target_band_min || "?"}${q.target_band_max ? `-${q.target_band_max}` : ""}`
        : null;

    // Part 1
    if (fmt === "speaking_part1") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                Part 1
              </Badge>
              {q.speaking_category && (
                <Badge variant="secondary" className="text-xs">
                  {q.speaking_category}
                </Badge>
              )}
            </div>
            {bandRange && <span className="text-xs text-gray-500">{bandRange}</span>}
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-lg">{q.content}</p>
          </div>
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Mic className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
            <Button variant="outline" size="sm" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      );
    }

    // Part 2 - Cue Card
    if (fmt === "speaking_part2") {
      const cueCardTopic = String(od.topic || "");
      const cueCardPoints = Array.isArray(od.points) ? od.points.map(String) : [];
      const imageUrl = getCdnUrl(String(od.image_url || q.image_url || ""));

      return (
        <div className="space-y-4">
          <div className="border-2 border-amber-300 rounded-lg overflow-hidden bg-amber-50/30">
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-100 border-b border-amber-200">
              <Badge className="text-xs font-semibold bg-amber-500 hover:bg-amber-500 text-white">
                Part 2 - Cue Card
              </Badge>
              {bandRange && <span className="text-xs font-medium text-amber-700">{bandRange}</span>}
            </div>
            <div className="p-5 space-y-4">
              <p className="text-base font-semibold text-gray-900">
                {cueCardTopic || q.content}
              </p>
              {cueCardPoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">You should say:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 pl-2">
                    {cueCardPoints.map((point, i) => (
                      <li key={i} className="leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {imageUrl && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <img
                    src={imageUrl}
                    alt="Cue card visual"
                    className="max-w-full h-auto max-h-[200px] rounded mx-auto"
                  />
                </div>
              )}
            </div>
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
              준비 시간: 1분 | 발표 시간: 1-2분
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Mic className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
            <Button variant="outline" size="sm" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      );
    }

    // Part 3
    if (fmt === "speaking_part3") {
      const depthLabel = q.depth_level ? `Level ${q.depth_level}` : null;

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium bg-violet-50 text-violet-700 border-violet-200">
                Part 3 - Discussion
              </Badge>
              {depthLabel && <Badge variant="secondary" className="text-xs">{depthLabel}</Badge>}
            </div>
            {bandRange && <span className="text-xs text-gray-500">{bandRange}</span>}
          </div>
          {(q.related_part2_id || q.related_part2_code) && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              연결된 Part 2: <span className="font-mono">{q.related_part2_code || q.related_part2_id}</span>
            </div>
          )}
          <div className="bg-white rounded-lg border p-6">
            <p className="text-lg">{q.content}</p>
          </div>
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Mic className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 mb-2">녹음 영역 (미리보기)</p>
            <Button variant="outline" size="sm" disabled>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div className="bg-white rounded-lg border p-6">
        <p>{q.content}</p>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────
  const renderQuestion = (q: QuestionData) => {
    const fmt = q.question_format;

    if (fmt === "fill_blank_typing") return renderFillBlankTyping(q);
    if (fmt === "fill_blank_drag") return renderFillBlankDrag(q);
    if (fmt === "table_completion") return renderTableCompletion(q);
    if (fmt === "mcq_single" || fmt === "mcq_multiple" || fmt === "mcq") return renderMCQ(q);
    if (fmt === "true_false_ng") return renderTFNG(q);
    if (fmt === "matching" || fmt === "heading_matching") return renderMatching(q);
    if (fmt === "flowchart") return renderFlowchart(q);
    if (fmt === "map_labeling") return renderMapLabeling(q);
    if (fmt === "essay" || fmt === "essay_task1" || fmt === "essay_task2") return renderEssay(q);
    if (fmt.startsWith("speaking_")) return renderSpeaking(q);

    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-sm text-gray-500">지원하지 않는 문제 형태: {fmt}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] max-w-[95vw] w-[95vw] max-h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            미리보기 - 실제 시험 화면
            {question && (
              <>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", TYPE_COLORS[question.question_type] || "bg-gray-100")}>
                  {question.question_type}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {question.question_code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {FORMAT_LABELS[question.question_format] || question.question_format}
                </Badge>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : question ? (
            <div className="p-8 bg-slate-100 min-h-full">
              {/* Audio */}
              {question.audio_url && (
                <div className="mb-6 bg-sky-50 border border-sky-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <audio controls className="w-full h-8" src={getCdnUrl(question.audio_url)}>
                      오디오를 지원하지 않습니다.
                    </audio>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {question.instructions && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900">{question.instructions}</p>
                </div>
              )}

              {/* Question content */}
              {renderQuestion(question)}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              문제를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
