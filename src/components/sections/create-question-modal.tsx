"use client";

import { useState, useCallback, useEffect } from "react";
// Dialog removed — now renders as a fixed side panel
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  ListOrdered,
  GripVertical,
  Type,
  GitBranch,
  FileText,
  Mic,
  X,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { RichTextEditor, uploadEditorImages, stripBlobImages } from "@/components/ui/rich-text-editor";
import { RequiredLabel } from "@/components/ui/required-label";
import { FileUpload, uploadFile } from "@/components/ui/file-upload";
import {
  type QuestionType,
  type QuestionFormat,
  type FlowchartNode,
  questionFormats,
} from "@/components/questions/types";
import { FlowchartEditor } from "@/components/questions/flowchart-editor";
import { TableCompletionEditor } from "@/components/questions/table-completion-editor";
import { FillBlankEditor, FillBlankDragEditor } from "@/components/questions/fill-blank-editor";

// ─── Types ──────────────────────────────────────────────────

interface CreateQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: string;
  onCreated: (questionId: string) => void;
}

interface BlankItem {
  id: string;
  number: number;
  answer: string;
  alternatives: string;
}

interface MCQOptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

interface MatchingOptionItem {
  id: string;
  label: string;
  text: string;
}

interface MatchingItemData {
  id: string;
  number: number;
  statement: string;
  correctLabel: string;
}

// ─── Speaking Sub-Question ───────────────────────────────────

interface SpeakingSubQuestion {
  id: string;
  text: string;
  timeLimitSeconds: string;
  allowResponseReset: boolean;
  audioUrl: string;
  audioFile: File | null;
}

// ─── Tab State ──────────────────────────────────────────────

interface TabState {
  id: string;
  selectedFormat: QuestionFormat | null;
  saved: boolean;
  savedQuestionId: string | null;
  // Common
  instructions: string;
  isPractice: boolean;
  separateNumbers: boolean;
  // MCQ
  mcqQuestion: string;
  mcqIsMultiple: boolean;
  mcqMaxSelections: number;
  mcqSeparateNumbers: boolean;
  mcqOptions: MCQOptionItem[];
  // T/F/NG
  tfngStatement: string;
  tfngAnswer: "true" | "false" | "not_given";
  // Matching
  matchingTitle: string;
  matchingContent: string;
  matchingAllowDuplicate: boolean;
  matchingOptions: MatchingOptionItem[];
  matchingItems: MatchingItemData[];
  // Fill blank
  fillTitle: string;
  fillContent: string;
  blanks: BlankItem[];
  wordBank: string[];
  newWord: string;
  blankMode: "word" | "sentence";
  fillBlankDragAllowDuplicate: boolean;
  // Table completion
  tableInputMode: "typing" | "drag";
  // Flowchart
  flowchartTitle: string;
  flowchartContent: string;
  flowchartNodes: FlowchartNode[];
  flowchartBlanks: BlankItem[];
  // Map labeling
  mapTitle: string;
  mapPassage: string;
  mapLabels: string[];
  mapItems: MatchingItemData[];
  // Essay
  essayTitle: string;
  essayCondition: string;
  essayPrompt: string;
  essayMinWords: string;
  // Audio (listening/speaking)
  audioUrl: string;
  audioFile: File | null;
  // Speaking (Part 1 & Part 3: multi-question groups)
  speakingQuestions: SpeakingSubQuestion[];
  speakingCategory: string;
  cueCardTopic: string;
  cueCardPoints: string[];
  generateFollowup: boolean;
  relatedPart2Id: string;
  depthLevel: 1 | 2 | 3;
  // Speaking Part 2 options_data params (migration 016)
  timeLimitSeconds: string;
  allowResponseReset: boolean;
  prepTimeSeconds: string;
  speakingTimeSeconds: string;
}

function createEmptyTab(): TabState {
  return {
    id: `tab-${++idCounter}-${Date.now()}`,
    selectedFormat: null,
    saved: false,
    savedQuestionId: null,
    instructions: "",
    isPractice: false,
    separateNumbers: true,
    mcqQuestion: "",
    mcqIsMultiple: false,
    mcqMaxSelections: 2,
    mcqSeparateNumbers: false,
    mcqOptions: [
      { id: "a", label: "A", text: "", isCorrect: false },
      { id: "b", label: "B", text: "", isCorrect: false },
      { id: "c", label: "C", text: "", isCorrect: false },
      { id: "d", label: "D", text: "", isCorrect: false },
    ],
    tfngStatement: "",
    tfngAnswer: "true",
    matchingTitle: "",
    matchingContent: "",
    matchingAllowDuplicate: false,
    matchingOptions: [
      { id: "o1", label: "A", text: "" },
      { id: "o2", label: "B", text: "" },
    ],
    matchingItems: [{ id: "m1", number: 1, statement: "", correctLabel: "" }],
    fillTitle: "",
    fillContent: "",
    blanks: [],
    wordBank: [],
    newWord: "",
    blankMode: "word",
    fillBlankDragAllowDuplicate: false,
    tableInputMode: "typing",
    flowchartTitle: "",
    flowchartContent: "",
    flowchartNodes: [],
    flowchartBlanks: [],
    mapTitle: "",
    mapPassage: "",
    mapLabels: ["A", "B", "C", "D", "E", "F", "G", "H"],
    mapItems: [{ id: "ml1", number: 1, statement: "", correctLabel: "" }],
    audioUrl: "",
    audioFile: null,
    essayTitle: "",
    essayCondition: "",
    essayPrompt: "",
    essayMinWords: "",
    speakingQuestions: Array.from({ length: 5 }, () => createSpeakingSubQuestion()),
    speakingCategory: "",
    cueCardTopic: "",
    cueCardPoints: ["", "", "", ""],
    generateFollowup: false,
    relatedPart2Id: "",
    depthLevel: 1,
    timeLimitSeconds: "",
    allowResponseReset: true,
    prepTimeSeconds: "60",
    speakingTimeSeconds: "120",
  };
}

// ─── Format Icons ───────────────────────────────────────────

const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: CheckCircle2,
  true_false_ng: ListOrdered,
  matching: GripVertical,
  fill_blank_typing: Type,
  fill_blank_drag: GripVertical,
  flowchart: GitBranch,
  table_completion: Type,
  map_labeling: GripVertical,
  essay: FileText,
  speaking_part1: Mic,
  speaking_part2: Mic,
  speaking_part3: Mic,
};

const formatDescriptions: Record<string, string> = {
  mcq: "단일선택 또는 복수선택 객관식",
  true_false_ng: "True / False / Not Given",
  matching: "지문 단락에 맞는 제목을 매칭",
  fill_blank_typing: "학생이 텍스트를 직접 입력",
  fill_blank_drag: "주어진 단어 목록에서 드래그하여 선택",
  flowchart: "플로우차트의 빈칸을 채우는 방식",
  table_completion: "테이블을 완성하는 형식의 문제",
  map_labeling: "지도/이미지의 위치에 해당하는 라벨 선택",
  essay: "주어진 주제에 대해 에세이 작성",
  speaking_part1: "Short Q&A on everyday topics (Interview)",
  speaking_part2: "Cue card topic with 1-2 min response",
  speaking_part3: "In-depth discussion related to Part 2",
};

let idCounter = 0;
function genId() {
  return `cqm-${++idCounter}-${Date.now()}`;
}

function createSpeakingSubQuestion(): SpeakingSubQuestion {
  return {
    id: genId(),
    text: "",
    timeLimitSeconds: "30",
    allowResponseReset: true,
    audioUrl: "",
    audioFile: null,
  };
}

// Short format label for tabs (MCQ is dynamic, see getTabLabel)
const formatShortLabels: Record<string, string> = {
  true_false_ng: "T/F/NG",
  matching: "매칭",
  fill_blank_typing: "빈칸(입력)",
  fill_blank_drag: "빈칸(드래그)",
  flowchart: "플로우차트",
  table_completion: "테이블",
  map_labeling: "지도라벨링",
  essay: "에세이",
  speaking_part1: "Part 1 (Interview)",
  speaking_part2: "Part 2 (Cue Card)",
  speaking_part3: "Part 3 (Discussion)",
};

function getTabLabel(t: TabState): string {
  if (!t.selectedFormat) return "";
  if (t.selectedFormat === "mcq") {
    return t.mcqIsMultiple ? "복수선택" : "단일선택";
  }
  return formatShortLabels[t.selectedFormat] || t.selectedFormat;
}

// ─── Component ──────────────────────────────────────────────

export function CreateQuestionModal({
  open,
  onOpenChange,
  sectionType,
  onCreated,
}: CreateQuestionModalProps) {
  const questionType = sectionType as QuestionType;
  const formats = questionFormats[questionType] || [];

  // Tab state
  const [tabs, setTabs] = useState<TabState[]>([createEmptyTab()]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Speaking API data (shared across tabs)
  const [part2Questions, setPart2Questions] = useState<{ id: string; question_code: string; topic: string }[]>([]);
  const [isLoadingSpeakingData, setIsLoadingSpeakingData] = useState(false);

  // Active tab shorthand
  const tab = tabs[activeTabIdx] || tabs[0];

  // Update active tab state
  const updateTab = useCallback((updates: Partial<TabState>) => {
    setTabs((prev) => prev.map((t, i) => (i === activeTabIdx ? { ...t, ...updates } : t)));
  }, [activeTabIdx]);

  // Speaking data load (Part 2 questions for Part 3 linking)
  useEffect(() => {
    if (open && questionType === "speaking" && part2Questions.length === 0) {
      setIsLoadingSpeakingData(true);
      api.get<{ questions: { id: string; question_code: string; topic: string }[] }>("/api/speaking/part2-questions")
        .then((p2Res) => {
          setPart2Questions(p2Res.data?.questions || []);
        })
        .catch(() => toast.error("Failed to load speaking data"))
        .finally(() => setIsLoadingSpeakingData(false));
    }
  }, [open, questionType, part2Questions.length]);

  // Reset on close
  const resetAll = useCallback(() => {
    setTabs([createEmptyTab()]);
    setActiveTabIdx(0);
    setIsSaving(false);
  }, []);

  const handlePanelClose = useCallback(() => {
    const unsaved = tabs.filter((t) => t.selectedFormat && !t.saved);
    if (unsaved.length > 0) {
      toast.warning(`저장되지 않은 문제가 ${unsaved.length}개 있습니다. 닫으시겠습니까?`, {
        id: "close-warning",
        actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
        action: {
          label: "닫기",
          onClick: () => {
            resetAll();
            onOpenChange(false);
          },
        },
        cancel: { label: "취소", onClick: () => {} },
      });
    } else {
      resetAll();
      onOpenChange(false);
    }
  }, [tabs, resetAll, onOpenChange]);

  // Add new tab
  const addTab = () => {
    const newTab = createEmptyTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabIdx(tabs.length);
  };

  // Remove tab
  const removeTab = (idx: number) => {
    if (tabs.length <= 1) return;
    const t = tabs[idx];
    if (t.selectedFormat && !t.saved) {
      toast.warning("이 탭의 내용이 저장되지 않았습니다. 삭제하시겠습니까?", {
        id: "remove-tab-warning",
        actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
        action: {
          label: "삭제",
          onClick: () => {
            setTabs((prev) => prev.filter((_, i) => i !== idx));
            setActiveTabIdx((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
          },
        },
        cancel: { label: "취소", onClick: () => {} },
      });
    } else {
      setTabs((prev) => prev.filter((_, i) => i !== idx));
      setActiveTabIdx((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
    }
  };

  // ─── Save ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!tab.selectedFormat) return;

    let actualFormat: string = tab.selectedFormat;
    let content = "";
    let optionsData: Record<string, unknown> = {};
    let answerData: Record<string, unknown> = {};
    let title: string | undefined;

    // Build payload per format
    if (tab.selectedFormat === "mcq") {
      if (!tab.mcqQuestion.trim()) { toast.error("문제를 입력해주세요."); return; }
      const hasCorrect = tab.mcqOptions.some((o) => o.isCorrect);
      if (!hasCorrect) { toast.error("정답을 하나 이상 선택해주세요."); return; }
      actualFormat = tab.mcqIsMultiple ? "mcq_multiple" : "mcq_single";
      content = tab.mcqQuestion;
      optionsData = {
        isMultiple: tab.mcqIsMultiple,
        maxSelections: tab.mcqIsMultiple ? tab.mcqMaxSelections : undefined,
        separateNumbers: tab.mcqIsMultiple ? tab.mcqSeparateNumbers : undefined,
        options: tab.mcqOptions.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect })),
      };
      if (tab.mcqIsMultiple) {
        const correctOptions = tab.mcqOptions.filter((o) => o.isCorrect);
        answerData = { correct: correctOptions.map((o) => o.label) };
      } else {
        const correctOption = tab.mcqOptions.find((o) => o.isCorrect);
        answerData = { correct: correctOption?.label || "" };
      }
    } else if (tab.selectedFormat === "true_false_ng") {
      if (!tab.tfngStatement.trim()) { toast.error("진술문을 입력해주세요."); return; }
      content = tab.tfngStatement;
      optionsData = { separateNumbers: tab.separateNumbers };
      answerData = { answer: tab.tfngAnswer };
    } else if (tab.selectedFormat === "matching") {
      if (tab.matchingOptions.length < 2) { toast.error("보기를 2개 이상 추가해주세요."); return; }
      if (tab.matchingItems.length < 1) { toast.error("문항을 1개 이상 추가해주세요."); return; }
      content = tab.matchingContent;
      title = tab.matchingTitle || undefined;
      optionsData = {
        title: tab.matchingTitle || undefined,
        separateNumbers: tab.separateNumbers,
        allowDuplicate: tab.matchingAllowDuplicate,
        options: tab.matchingOptions.map((o) => ({ label: o.label, text: o.text })),
        items: tab.matchingItems.map((i) => ({ number: i.number, statement: i.statement, correctLabel: i.correctLabel })),
      };
      answerData = {
        matches: tab.matchingItems.map((i) => ({ number: i.number, correctLabel: i.correctLabel })),
      };
    } else if (tab.selectedFormat === "fill_blank_typing" || tab.selectedFormat === "fill_blank_drag") {
      if (!tab.fillContent.trim()) { toast.error("본문을 입력해주세요."); return; }
      if (tab.blanks.length === 0) { toast.error("빈칸을 1개 이상 추가해주세요."); return; }
      content = tab.fillContent;
      title = tab.fillTitle || undefined;
      optionsData = {
        title: tab.fillTitle || undefined,
        separateNumbers: tab.separateNumbers,
        blank_mode: tab.blankMode,
        ...(tab.selectedFormat === "fill_blank_drag" ? { word_bank: tab.wordBank, allow_duplicate: tab.fillBlankDragAllowDuplicate } : {}),
      };
      answerData = {
        blanks: tab.blanks.map((b) => ({
          number: b.number,
          answer: b.answer,
          alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
        })),
      };
    } else if (tab.selectedFormat === "table_completion") {
      if (!tab.fillContent.trim()) { toast.error("테이블 내용을 입력해주세요."); return; }
      if (tab.blanks.length === 0) { toast.error("빈칸을 1개 이상 추가해주세요."); return; }
      content = tab.fillContent;
      title = tab.fillTitle || undefined;
      optionsData = {
        title: tab.fillTitle || undefined,
        separateNumbers: tab.separateNumbers,
        blank_mode: tab.blankMode,
        input_mode: tab.tableInputMode,
        ...(tab.tableInputMode === "drag" ? { word_bank: tab.wordBank } : {}),
      };
      answerData = {
        blanks: tab.blanks.map((b) => ({
          number: b.number,
          answer: b.answer,
          alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
        })),
      };
    } else if (tab.selectedFormat === "flowchart") {
      if (tab.flowchartNodes.length === 0) { toast.error("노드를 1개 이상 추가해주세요."); return; }
      if (tab.flowchartBlanks.length === 0) { toast.error("빈칸을 1개 이상 추가해주세요."); return; }
      const nodes = tab.flowchartNodes.map(n => ({
        id: n.id, type: n.type, content: n.content, row: n.row, col: n.col, label: n.label,
      }));
      content = JSON.stringify({ title: tab.flowchartTitle, nodes });
      title = tab.flowchartTitle || undefined;
      optionsData = { separateNumbers: tab.separateNumbers };
      answerData = {
        blanks: tab.flowchartBlanks.map((b) => ({
          number: b.number,
          answer: b.answer,
          alternatives: b.alternatives ? b.alternatives.split(",").map((s) => s.trim()).filter(Boolean) : [],
        })),
      };
    } else if (tab.selectedFormat === "map_labeling") {
      if (tab.mapItems.length === 0) { toast.error("문항을 1개 이상 추가해주세요."); return; }
      content = stripBlobImages(tab.mapPassage) || " ";
      title = tab.mapTitle || undefined;
      optionsData = {
        title: tab.mapTitle || undefined,
        separateNumbers: tab.separateNumbers,
        labels: tab.mapLabels,
        items: tab.mapItems.map((i) => ({ number: i.number, statement: i.statement, correctLabel: i.correctLabel })),
      };
      answerData = {
        items: tab.mapItems.map((i) => ({ number: i.number, correctLabel: i.correctLabel })),
      };
    } else if (tab.selectedFormat === "essay") {
      if (!tab.essayPrompt.trim()) { toast.error("에세이 주제를 입력해주세요."); return; }
      content = stripBlobImages(tab.essayPrompt);
      title = tab.essayTitle || undefined;
      optionsData = {
        title: tab.essayTitle || undefined,
        condition: tab.essayCondition || undefined,
        min_words: tab.essayMinWords ? parseInt(tab.essayMinWords) : undefined,
      };
    } else if (tab.selectedFormat === "speaking_part1") {
      const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
      if (filledQuestions.length === 0) { toast.error("Please enter at least one question."); return; }
      content = filledQuestions[0].text;
      optionsData = {
        questions: filledQuestions.map((q, i) => ({
          number: i + 1,
          text: q.text,
          time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
          allow_response_reset: q.allowResponseReset,
          audio_url: q.audioUrl && !q.audioFile ? q.audioUrl : undefined,
        })),
      };
    } else if (tab.selectedFormat === "speaking_part2") {
      if (!tab.cueCardTopic.trim()) { toast.error("Please enter a cue card topic."); return; }
      content = JSON.stringify({
        topic: stripBlobImages(tab.cueCardTopic),
        points: tab.cueCardPoints.filter((p) => p.trim()),
      });
      optionsData = {
        generate_followup: tab.generateFollowup,
      };
    } else if (tab.selectedFormat === "speaking_part3") {
      const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
      if (filledQuestions.length === 0) { toast.error("Please enter at least one question."); return; }
      content = filledQuestions[0].text;
      optionsData = {
        questions: filledQuestions.map((q, i) => ({
          number: i + 1,
          text: q.text,
          time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
          allow_response_reset: q.allowResponseReset,
          audio_url: q.audioUrl && !q.audioFile ? q.audioUrl : undefined,
        })),
      };
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        question_type: questionType,
        question_format: actualFormat,
        content,
        title,
        instructions: (tab.selectedFormat !== "mcq" && tab.selectedFormat !== "true_false_ng") ? tab.instructions || undefined : undefined,
        options_data: Object.keys(optionsData).length > 0 ? optionsData : undefined,
        answer_data: Object.keys(answerData).length > 0 ? answerData : undefined,
        is_practice: tab.isPractice,
        audio_url: (questionType === "listening" || tab.selectedFormat === "speaking_part2") && tab.audioUrl && !tab.audioFile ? tab.audioUrl : undefined,
        // speaking_category removed
        related_part2_id: tab.selectedFormat === "speaking_part3" ? tab.relatedPart2Id || undefined : undefined,
        depth_level: tab.selectedFormat === "speaking_part3" ? tab.depthLevel : undefined,
        generate_followup: tab.selectedFormat === "speaking_part2" ? tab.generateFollowup : undefined,
        // Speaking options_data params (migration 016) — Part 2 only (Part 1/3 use per-question settings in options_data)
        time_limit_seconds: tab.selectedFormat === "speaking_part2"
          ? (tab.timeLimitSeconds ? parseInt(tab.timeLimitSeconds) : undefined) : undefined,
        allow_response_reset: tab.selectedFormat === "speaking_part2"
          ? tab.allowResponseReset : undefined,
        prep_time_seconds: tab.selectedFormat === "speaking_part2"
          ? (tab.prepTimeSeconds ? parseInt(tab.prepTimeSeconds) : 60) : undefined,
        speaking_time_seconds: tab.selectedFormat === "speaking_part2"
          ? (tab.speakingTimeSeconds ? parseInt(tab.speakingTimeSeconds) : 120) : undefined,
      };

      // Remove blob URLs from options_data
      if (payload.options_data) {
        const od = payload.options_data as Record<string, unknown>;
        // Strip blob URLs from sub-question audio_url fields
        if (Array.isArray(od.questions)) {
          for (const q of od.questions as Record<string, unknown>[]) {
            if (q.audio_url && typeof q.audio_url === "string" && (q.audio_url as string).startsWith("blob:")) {
              delete q.audio_url;
            }
          }
        }
      }

      const { data, error } = await api.post<{ id: string; question_code: string }>("/api/questions", payload);
      if (error || !data) throw new Error(error || "저장 실패");

      // Upload deferred files if any
      if (data.question_code) {
        const context = `questions/${data.question_code}`;
        const updatePayload: Record<string, unknown> = {};

        // Audio file upload
        if (tab.audioFile) {
          try {
            const uploaded = await uploadFile(tab.audioFile, "audio", context);
            updatePayload.audio_url = uploaded.path;
          } catch {
            toast.error("오디오 업로드에 실패했습니다. 상세 페이지에서 다시 저장해주세요.");
          }
        }

        // 에디터 이미지 업로드 (blob URL → R2 상대 경로)
        try {
          if (tab.selectedFormat === "essay" && tab.essayPrompt.includes("blob:")) {
            updatePayload.content = await uploadEditorImages(tab.essayPrompt, context);
          } else if (tab.selectedFormat === "speaking_part2" && tab.cueCardTopic.includes("blob:")) {
            const uploadedTopic = await uploadEditorImages(tab.cueCardTopic, context);
            updatePayload.content = JSON.stringify({
              topic: uploadedTopic,
              points: tab.cueCardPoints.filter((p) => p.trim()),
            });
          } else if (tab.selectedFormat === "map_labeling" && tab.mapPassage.includes("blob:")) {
            updatePayload.content = await uploadEditorImages(tab.mapPassage, context);
          }
        } catch {
          toast.error("이미지 업로드에 실패했습니다.");
        }

        // Per-sub-question audio upload for Part 1 / Part 3
        if (tab.selectedFormat === "speaking_part1" || tab.selectedFormat === "speaking_part3") {
          const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
          const questionsWithAudio = filledQuestions.filter((q) => q.audioFile);
          if (questionsWithAudio.length > 0) {
            const existingOd = (payload.options_data || {}) as Record<string, unknown>;
            const questions = (existingOd.questions || []) as Record<string, unknown>[];
            let audioUploadFailed = false;
            for (const sq of questionsWithAudio) {
              const idx = filledQuestions.indexOf(sq);
              if (idx >= 0 && questions[idx]) {
                try {
                  const uploaded = await uploadFile(sq.audioFile!, "audio", `${context}/q${idx + 1}`);
                  questions[idx].audio_url = uploaded.path;
                } catch {
                  audioUploadFailed = true;
                }
              }
            }
            if (audioUploadFailed) {
              toast.error("Some question audio uploads failed.");
            }
            updatePayload.options_data = { ...existingOd, questions };
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          try {
            await api.put(`/api/questions/${data.id}`, updatePayload);
          } catch {
            toast.error("파일 URL 업데이트에 실패했습니다.");
          }
        }
      }

      toast.success("Question created successfully.");
      updateTab({ saved: true, savedQuestionId: data.id });
      onCreated(data.id);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── MCQ helpers ──────────────────────────────────────────

  const addMcqOption = () => {
    const nextLabel = String.fromCharCode(65 + tab.mcqOptions.length);
    updateTab({ mcqOptions: [...tab.mcqOptions, { id: genId(), label: nextLabel, text: "", isCorrect: false }] });
  };

  const removeMcqOption = (id: string) => {
    if (tab.mcqOptions.length <= 2) return;
    const filtered = tab.mcqOptions.filter((o) => o.id !== id);
    const relabeled = filtered.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }));
    const newMax = tab.mcqMaxSelections > relabeled.length ? Math.max(2, relabeled.length) : tab.mcqMaxSelections;
    updateTab({ mcqOptions: relabeled, mcqMaxSelections: newMax });
  };

  const updateMcqOption = (id: string, data: Partial<MCQOptionItem>) => {
    updateTab({ mcqOptions: tab.mcqOptions.map((o) => (o.id === id ? { ...o, ...data } : o)) });
  };

  // ─── Matching helpers ─────────────────────────────────────

  const addMatchingOption = () => {
    const nextLabel = String.fromCharCode(65 + tab.matchingOptions.length);
    updateTab({ matchingOptions: [...tab.matchingOptions, { id: genId(), label: nextLabel, text: "" }] });
  };

  const removeMatchingOption = (id: string) => {
    if (tab.matchingOptions.length <= 2) return;
    const filtered = tab.matchingOptions.filter((o) => o.id !== id);
    const relabeled = filtered.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }));
    updateTab({ matchingOptions: relabeled });
  };

  const addMatchingItem = () => {
    updateTab({
      matchingItems: [
        ...tab.matchingItems,
        { id: genId(), number: tab.matchingItems.length + 1, statement: "", correctLabel: "" },
      ],
    });
  };

  const removeMatchingItem = (id: string) => {
    if (tab.matchingItems.length <= 1) return;
    const filtered = tab.matchingItems.filter((i) => i.id !== id);
    const renumbered = filtered.map((i, idx) => ({ ...i, number: idx + 1 }));
    updateTab({ matchingItems: renumbered });
  };

  // ─── Blank helpers ────────────────────────────────────────

  const addBlank = () => {
    updateTab({ blanks: [...tab.blanks, { id: genId(), number: tab.blanks.length + 1, answer: "", alternatives: "" }] });
  };

  const removeBlank = (id: string) => {
    const filtered = tab.blanks.filter((b) => b.id !== id);
    const renumbered = filtered.map((b, i) => ({ ...b, number: i + 1 }));
    updateTab({ blanks: renumbered });
  };

  const addFlowchartBlank = () => {
    updateTab({
      flowchartBlanks: [
        ...tab.flowchartBlanks,
        { id: genId(), number: tab.flowchartBlanks.length + 1, answer: "", alternatives: "" },
      ],
    });
  };

  const removeFlowchartBlank = (id: string) => {
    const filtered = tab.flowchartBlanks.filter((b) => b.id !== id);
    const renumbered = filtered.map((b, i) => ({ ...b, number: i + 1 }));
    updateTab({ flowchartBlanks: renumbered });
  };

  const addFlowchartNode = useCallback((type: "box" | "branch") => {
    const maxRow = tab.flowchartNodes.length > 0
      ? Math.max(...tab.flowchartNodes.map(n => n.row ?? 0))
      : -1;
    if (type === "box") {
      updateTab({
        flowchartNodes: [...tab.flowchartNodes, {
          id: genId(), type: "box", content: "", row: maxRow + 1, col: 0,
        }],
      });
    } else {
      updateTab({
        flowchartNodes: [...tab.flowchartNodes,
          { id: genId(), type: "branch", content: "", row: maxRow + 1, col: 0 },
          { id: genId(), type: "branch", content: "", row: maxRow + 1, col: 1 },
        ],
      });
    }
  }, [tab.flowchartNodes, updateTab]);

  // ─── Map labeling helpers ─────────────────────────────────

  const addMapItem = () => {
    updateTab({
      mapItems: [
        ...tab.mapItems,
        { id: genId(), number: tab.mapItems.length + 1, statement: "", correctLabel: "" },
      ],
    });
  };

  const removeMapItem = (id: string) => {
    if (tab.mapItems.length <= 1) return;
    const filtered = tab.mapItems.filter((i) => i.id !== id);
    const renumbered = filtered.map((i, idx) => ({ ...i, number: idx + 1 }));
    updateTab({ mapItems: renumbered });
  };

  const handleMapLabelCountChange = (count: number) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newLabels = Array.from({ length: count }, (_, i) => alphabet[i]);
    updateTab({
      mapLabels: newLabels,
      mapItems: tab.mapItems.map((item) =>
        !newLabels.includes(item.correctLabel) ? { ...item, correctLabel: "" } : item
      ),
    });
  };

  // ─── Render: Tab Bar ──────────────────────────────────────

  const renderTabBar = () => (
    <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 border-b overflow-x-auto shrink-0">
      {tabs.map((t, idx) => {
        const isActive = idx === activeTabIdx;
        const label = t.selectedFormat
          ? getTabLabel(t)
          : `문제 ${idx + 1}`;
        return (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-sm cursor-pointer transition-colors border border-b-0 shrink-0",
              isActive
                ? "bg-white text-foreground font-medium border-slate-300"
                : "bg-slate-200 text-muted-foreground hover:bg-slate-50 border-transparent"
            )}
            onClick={() => setActiveTabIdx(idx)}
          >
            {t.saved && (
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
            )}
            <span className="truncate max-w-[100px]">{label}</span>
            {tabs.length > 1 && (
              <button
                className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded"
                onClick={(e) => { e.stopPropagation(); removeTab(idx); }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
        onClick={addTab}
        title="새 문제 탭 추가"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 저장 버튼 — 탭 바 맨 오른쪽 */}
      <div className="ml-auto shrink-0">
        <Button onClick={handleSave} disabled={isSaving || tab.saved} size="sm">
          {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          저장
        </Button>
      </div>
    </div>
  );

  // ─── Render: Format Selection ─────────────────────────────

  const renderFormatSelection = () => (
    <div className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold">문제 형태 선택</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {questionType.charAt(0).toUpperCase() + questionType.slice(1)} 문제 형태를 선택하세요.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {formats.map((f) => {
          const Icon = formatIcons[f.value] || FileText;
          return (
            <button
              key={f.value}
              onClick={() => updateTab({ selectedFormat: f.value as QuestionFormat })}
              className="flex items-start gap-3 p-4 border-2 rounded-lg bg-white hover:border-primary hover:shadow transition-all text-left"
            >
              <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">{f.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDescriptions[f.value] || ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Render: Settings Panel (좌측 사이드바) ─────────────────

  const renderSettingsPanel = () => {
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

        {/* ─── Response Settings (Part 2 only — Part 1/3 have per-question settings) ─── */}
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
  };

  // ─── Render: Editor ───────────────────────────────────────

  const renderEditor = () => {
    const fmt = tab.selectedFormat!;

    return (
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Editor header */}
        <div className="border-b px-6 py-2.5 flex items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => updateTab({ selectedFormat: null })} disabled={tab.saved}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              형태 변경
            </Button>
            <Badge variant="outline">{formats.find((f) => f.value === fmt)?.label || fmt}</Badge>
            {tab.saved && (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <Check className="h-3 w-3 mr-1" />
                저장 완료
              </Badge>
            )}
          </div>
        </div>

        {/* 2-panel content */}
        <div className="flex-1 flex overflow-hidden">
          {/* 좌측: 설정 사이드바 */}
          <div className="w-72 border-r bg-slate-50 overflow-y-auto shrink-0">
            <div className="p-4">
              {renderSettingsPanel()}
            </div>
          </div>

          {/* 우측: 에디터 */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {tab.saved && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-center">
                  이 문제는 이미 저장되었습니다. 새 문제를 추가하려면 &quot;+&quot; 탭을 클릭하세요.
                </div>
              )}

              {/* Instructions (공통, MCQ/T/F/NG/flowchart 제외 — flowchart는 FlowchartEditor 내장) */}
              {fmt !== "mcq" && fmt !== "true_false_ng" && fmt !== "flowchart" && (
                <div>
                  <Label className="text-sm font-medium">지시문 (Instructions)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="예: Choose the correct letter, A, B, C or D."
                    value={tab.instructions}
                    onChange={(e) => updateTab({ instructions: e.target.value })}
                    rows={2}
                    disabled={tab.saved}
                  />
                </div>
              )}

              {/* Format-specific editors */}
              {fmt === "mcq" && renderMCQ()}
              {fmt === "true_false_ng" && renderTFNG()}
              {fmt === "matching" && renderMatching()}
              {(fmt === "fill_blank_typing" || fmt === "fill_blank_drag") && renderFillBlank()}
              {fmt === "table_completion" && renderTableCompletion()}
              {fmt === "flowchart" && renderFlowchart()}
              {fmt === "map_labeling" && renderMapLabeling()}
              {fmt === "essay" && renderEssay()}
              {(fmt === "speaking_part1" || fmt === "speaking_part3") && renderSpeakingSimple()}
              {fmt === "speaking_part2" && renderSpeakingPart2()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Format-specific renders ──────────────────────────────

  const toggleMcqMode = (isMultiple: boolean) => {
    const hasData = tab.mcqQuestion.trim() || tab.mcqOptions.some((o) => o.text.trim() || o.isCorrect);
    if (hasData) {
      updateTab({
        mcqIsMultiple: isMultiple,
        mcqQuestion: "",
        mcqOptions: [
          { id: "a", label: "A", text: "", isCorrect: false },
          { id: "b", label: "B", text: "", isCorrect: false },
          { id: "c", label: "C", text: "", isCorrect: false },
          { id: "d", label: "D", text: "", isCorrect: false },
        ],
        mcqMaxSelections: 2,
      });
      toast.info("선택 방식이 변경되어 입력 내용이 초기화되었습니다.");
    } else {
      updateTab({ mcqIsMultiple: isMultiple });
    }
  };

  const correctCount = tab.mcqOptions.filter((o) => o.isCorrect).length;

  const renderMCQ = () => (
    <div className="space-y-6">
      {/* 문제 */}
      <div className="space-y-2">
        <Label>문제 <span className="text-red-500">*</span></Label>
        <RichTextEditor value={tab.mcqQuestion} onChange={(v) => updateTab({ mcqQuestion: v })} placeholder="문제를 입력하세요" minHeight="80px" />
      </div>

      {/* 선택지 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>선택지 <span className="text-red-500">*</span></Label>
          <Button variant="outline" size="sm" onClick={addMcqOption} disabled={tab.saved}>
            <Plus className="h-4 w-4 mr-1" />
            선택지 추가
          </Button>
        </div>
        {tab.mcqOptions.map((opt) => (
          <div key={opt.id} className="flex items-center gap-3">
            <button
              type="button"
              disabled={tab.saved}
              onClick={() => {
                if (tab.mcqIsMultiple) {
                  updateMcqOption(opt.id, { isCorrect: !opt.isCorrect });
                } else {
                  updateTab({ mcqOptions: tab.mcqOptions.map((o) => ({ ...o, isCorrect: o.id === opt.id })) });
                }
              }}
              className={cn(
                "w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold transition-colors",
                opt.isCorrect
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-slate-300 hover:border-primary"
              )}
            >
              {opt.label}
            </button>
            <Input
              value={opt.text}
              onChange={(e) => updateMcqOption(opt.id, { text: e.target.value })}
              placeholder={`선택지 ${opt.label}`}
              className="flex-1"
              disabled={tab.saved}
            />
            {tab.mcqOptions.length > 2 && !tab.saved && (
              <Button variant="ghost" size="icon" onClick={() => removeMcqOption(opt.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          {tab.mcqIsMultiple
            ? `정답을 ${tab.mcqMaxSelections}개 선택하세요 (클릭하여 토글)`
            : "정답을 클릭하세요 (하나만 선택 가능)"}
        </p>
      </div>
    </div>
  );

  const renderTFNG = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>문항 제목 <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={tab.tfngStatement}
          onChange={(v) => updateTab({ tfngStatement: v })}
          placeholder="예: The number of students increased significantly in 2020."
          minHeight="80px"
        />
      </div>

      <div className="space-y-3">
        <Label>정답</Label>
        <div className="flex gap-3">
          {(["true", "false", "not_given"] as const).map((val) => (
            <button
              key={val}
              onClick={() => updateTab({ tfngAnswer: val })}
              disabled={tab.saved}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all border-2",
                tab.tfngAnswer === val
                  ? "bg-primary text-white border-primary"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              )}
            >
              {val === "true" ? "TRUE" : val === "false" ? "FALSE" : "NOT GIVEN"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMatching = () => (
    <div className="space-y-6">
      {/* 지문 입력 */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label>문제 제목</Label>
          <Input value={tab.matchingTitle} onChange={(e) => updateTab({ matchingTitle: e.target.value })} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" disabled={tab.saved} />
        </div>
        <div className="space-y-2">
          <Label>문제 내용 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">
            섹션 시작 위치에 <code className="bg-slate-100 px-1 rounded">[번호]</code> 형식으로 마커를 입력하세요.
          </p>
          <RichTextEditor value={tab.matchingContent} onChange={(v) => updateTab({ matchingContent: v })} placeholder="지문 내용을 입력하세요..." minHeight="200px" />
        </div>
      </div>

      {/* 제목 목록 */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>제목 목록 (List of Headings) <span className="text-red-500">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5">정답 제목과 오답(함정) 제목을 모두 추가하세요.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addMatchingOption} disabled={tab.saved}>
            <Plus className="h-4 w-4 mr-1" />
            제목 추가
          </Button>
        </div>
        <div className="border rounded-lg divide-y">
          {tab.matchingOptions.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 px-3 py-2">
              <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                {opt.label}
              </span>
              <Input
                className="flex-1 h-8 text-sm"
                value={opt.text}
                onChange={(e) => updateTab({ matchingOptions: tab.matchingOptions.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })}
                placeholder={`제목 ${opt.label} 입력`}
                disabled={tab.saved}
              />
              {tab.matchingOptions.length > 2 && !tab.saved && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeMatchingOption(opt.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 문항 (섹션-제목 매핑) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>문항 <span className="text-red-500">*</span></Label>
            <Button variant="outline" size="sm" onClick={addMatchingItem} disabled={tab.saved}>
              <Plus className="h-4 w-4 mr-1" /> 문항 추가
            </Button>
          </div>
          <div className="border rounded-lg divide-y">
            {tab.matchingItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                <span className="w-5 text-right font-bold text-muted-foreground shrink-0">{item.number}</span>
                <Input
                  className="flex-1 h-8 text-sm"
                  value={item.statement}
                  onChange={(e) => updateTab({ matchingItems: tab.matchingItems.map((i) => (i.id === item.id ? { ...i, statement: e.target.value } : i)) })}
                  placeholder="문항 내용"
                  disabled={tab.saved}
                />
                <Select
                  value={item.correctLabel}
                  onValueChange={(v) => updateTab({ matchingItems: tab.matchingItems.map((i) => (i.id === item.id ? { ...i, correctLabel: v } : i)) })}
                  disabled={tab.saved}
                >
                  <SelectTrigger className="w-20 h-8 text-xs shrink-0">
                    <SelectValue placeholder="정답" />
                  </SelectTrigger>
                  <SelectContent>
                    {tab.matchingOptions.map((o) => (
                      <SelectItem key={o.label} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tab.matchingItems.length > 1 && !tab.saved && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeMatchingItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const renderFillBlank = () => {
    const fmt = tab.selectedFormat;
    if (fmt === "fill_blank_drag") {
      return (
        <div className="space-y-6">
          <FillBlankDragEditor
            title={tab.fillTitle}
            setTitle={(v) => updateTab({ fillTitle: v })}
            content={tab.fillContent}
            setContent={(v) => updateTab({ fillContent: v })}
            blanks={tab.blanks.map(b => ({
              ...b,
              alternatives: typeof b.alternatives === "string"
                ? b.alternatives.split(",").map(s => s.trim()).filter(Boolean)
                : (b.alternatives || []),
            }))}
            setBlanks={(v) => updateTab({
              blanks: v.map(b => ({
                ...b,
                alternatives: Array.isArray(b.alternatives) ? b.alternatives.join(", ") : (b.alternatives || ""),
              })),
            })}
            wordBank={tab.wordBank}
            setWordBank={(v) => updateTab({ wordBank: v })}
            blankMode={tab.blankMode}
            setBlankMode={(v) => updateTab({ blankMode: v })}
            allowDuplicate={tab.fillBlankDragAllowDuplicate}
            setAllowDuplicate={(v) => updateTab({ fillBlankDragAllowDuplicate: v })}
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <FillBlankEditor
          title={tab.fillTitle}
          setTitle={(v) => updateTab({ fillTitle: v })}
          content={tab.fillContent}
          setContent={(v) => updateTab({ fillContent: v })}
          blanks={tab.blanks.map(b => ({
            ...b,
            alternatives: typeof b.alternatives === "string"
              ? b.alternatives.split(",").map(s => s.trim()).filter(Boolean)
              : (b.alternatives || []),
          }))}
          setBlanks={(v) => updateTab({
            blanks: v.map(b => ({
              ...b,
              alternatives: Array.isArray(b.alternatives) ? b.alternatives.join(", ") : (b.alternatives || ""),
            })),
          })}
          blankMode={tab.blankMode}
          setBlankMode={(v) => updateTab({ blankMode: v })}
        />
      </div>
    );
  };

  const renderTableCompletion = () => (
    <div className="space-y-6">
      <TableCompletionEditor
        title={tab.fillTitle}
        setTitle={(v) => updateTab({ fillTitle: v })}
        content={tab.fillContent}
        setContent={(v) => updateTab({ fillContent: v })}
        blanks={tab.blanks.map(b => ({
          ...b,
          alternatives: typeof b.alternatives === "string"
            ? b.alternatives.split(",").map(s => s.trim()).filter(Boolean)
            : (b.alternatives || []),
        }))}
        setBlanks={(v) => updateTab({
          blanks: v.map(b => ({
            ...b,
            alternatives: Array.isArray(b.alternatives) ? b.alternatives.join(", ") : (b.alternatives || ""),
          })),
        })}
        wordBank={tab.wordBank}
        setWordBank={(v) => updateTab({ wordBank: v })}
        blankMode={tab.blankMode}
        setBlankMode={(v) => updateTab({ blankMode: v })}
        inputMode={tab.tableInputMode}
        setInputMode={(v) => updateTab({ tableInputMode: v })}
      />
    </div>
  );

  const renderFlowchart = () => (
    <div className="space-y-6">
      <FlowchartEditor
        title={tab.flowchartTitle}
        setTitle={(v) => updateTab({ flowchartTitle: v })}
        nodes={tab.flowchartNodes}
        setNodes={(v) => updateTab({ flowchartNodes: v })}
        addNode={addFlowchartNode}
        blanks={tab.flowchartBlanks.map(b => ({
          ...b,
          alternatives: typeof b.alternatives === "string"
            ? b.alternatives.split(",").map(s => s.trim()).filter(Boolean)
            : (b.alternatives || []),
        }))}
        setBlanks={(v) => updateTab({
          flowchartBlanks: v.map(b => ({
            ...b,
            alternatives: Array.isArray(b.alternatives) ? b.alternatives.join(", ") : (b.alternatives || ""),
          })),
        })}
        updateBlank={(id, field, value) => {
          updateTab({
            flowchartBlanks: tab.flowchartBlanks.map(b => {
              if (b.id !== id) return b;
              if (field === "alternatives") {
                return { ...b, alternatives: Array.isArray(value) ? (value as string[]).join(", ") : String(value) };
              }
              return { ...b, [field]: value };
            }),
          });
        }}
        instructions={tab.instructions}
        setInstructions={(v) => updateTab({ instructions: v })}
      />
    </div>
  );

  const renderMapLabeling = () => (
    <div className="space-y-4">
      {/* 제목 + 지문 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <RequiredLabel>제목</RequiredLabel>
          <Input
            value={tab.mapTitle}
            onChange={(e) => updateTab({ mapTitle: e.target.value })}
            placeholder="예: Map of Shopping Centre"
            disabled={tab.saved}
          />
        </div>
        <div className="space-y-2">
          <Label>지문 (선택)</Label>
          <RichTextEditor
            value={tab.mapPassage}
            onChange={(v) => updateTab({ mapPassage: v })}
            placeholder="지도에 대한 설명 텍스트 (선택사항)"
            minHeight="60px"
          />
        </div>
      </div>

      {/* 라벨 설정 + 테이블 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Label className="shrink-0">라벨 개수</Label>
          <Select
            value={String(tab.mapLabels.length)}
            onValueChange={(v) => handleMapLabelCountChange(parseInt(v))}
            disabled={tab.saved}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}개 (A~{"ABCDEFGHIJ"[n - 1]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium">건물/장소명</th>
                {tab.mapLabels.map((label) => (
                  <th key={label} className="px-1 py-2 text-center font-medium w-12">{label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {tab.mapItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground shrink-0 w-5 text-right">{item.number}</span>
                      <Input
                        className="h-8 text-sm min-w-[200px]"
                        value={item.statement}
                        onChange={(e) => updateTab({ mapItems: tab.mapItems.map((i) => (i.id === item.id ? { ...i, statement: e.target.value } : i)) })}
                        placeholder="예: Quilt Shop"
                        disabled={tab.saved}
                      />
                    </div>
                  </td>
                  {tab.mapLabels.map((label) => (
                    <td key={label} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        disabled={tab.saved}
                        className={cn(
                          "w-9 h-9 rounded border-2 flex items-center justify-center transition-colors mx-auto",
                          item.correctLabel === label
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        onClick={() => updateTab({ mapItems: tab.mapItems.map((i) => (i.id === item.id ? { ...i, correctLabel: i.correctLabel === label ? "" : label } : i)) })}
                      >
                        {item.correctLabel === label && "✓"}
                      </button>
                    </td>
                  ))}
                  <td className="px-1 py-1.5">
                    {tab.mapItems.length > 1 && !tab.saved && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMapItem(item.id)}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!tab.saved && (
          <Button variant="outline" size="sm" className="w-full" onClick={addMapItem}>
            <Plus className="h-4 w-4 mr-1" />
            문제 추가
          </Button>
        )}
      </div>
    </div>
  );

  const renderEssay = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>IELTS Writing</strong>: Task 1은 그래프/차트 이미지와 함께 최소 150단어, Task 2는 에세이 주제만으로 최소 250단어가 일반적입니다.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>제목 <span className="text-red-500">*</span></Label>
          <Input
            value={tab.essayTitle}
            onChange={(e) => updateTab({ essayTitle: e.target.value })}
            placeholder="예: WRITING TASK 1"
            disabled={tab.saved}
          />
        </div>
        <div className="space-y-2">
          <Label>최소 단어 수 <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={tab.essayMinWords}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^[1-9]\d{0,3}$/.test(val)) {
                updateTab({ essayMinWords: val });
              }
            }}
            placeholder="예: 150 또는 250"
            disabled={tab.saved}
          />
          <p className="text-xs text-muted-foreground">
            Task 1: 150, Task 2: 250이 일반적
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>조건 (선택)</Label>
        <Input
          value={tab.essayCondition}
          onChange={(e) => updateTab({ essayCondition: e.target.value })}
          placeholder="예: You should spend about 20 minutes on this task."
          disabled={tab.saved}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>작문 주제 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">Ctrl+B: 굵게</p>
        </div>
        <RichTextEditor
          value={tab.essayPrompt}
          onChange={(v) => updateTab({ essayPrompt: v })}
          placeholder="작문 주제를 입력하세요"
          minHeight="200px"
        />
      </div>
    </div>
  );



  const [expandedSpeakingCards, setExpandedSpeakingCards] = useState<Set<string>>(new Set());

  const toggleSpeakingCard = (id: string) => {
    setExpandedSpeakingCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderSpeakingSimple = () => {
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
      setExpandedSpeakingCards((prev) => new Set(prev).add(newQ.id));
    };

    const removeSubQuestion = (id: string) => {
      if (tab.speakingQuestions.length <= 1) return;
      updateTab({
        speakingQuestions: tab.speakingQuestions.filter((q) => q.id !== id),
      });
      setExpandedSpeakingCards((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    const filledCount = tab.speakingQuestions.filter((q) => q.text.trim()).length;

    const getTextPreview = (html: string) => {
      const text = html.replace(/<[^>]*>/g, "").trim();
      return text.length > 40 ? text.slice(0, 40) + "..." : text || "Empty";
    };

    return (
      <div className="space-y-6">
        {isPart1 && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="font-medium text-emerald-900">Part 1: Interview</p>
            <p className="text-sm text-emerald-700 mt-1">
              Short questions about everyday topics. Add multiple questions below &mdash; each has its own time limit and settings.
            </p>
          </div>
        )}

        {isPart3 && (
          <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
            <p className="font-medium text-violet-900">Part 3: Discussion</p>
            <p className="text-sm text-violet-700 mt-1">
              Abstract, in-depth questions related to the Part 2 topic. Add multiple questions below.
            </p>
          </div>
        )}

        {/* Question count summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filledCount}</span> / {tab.speakingQuestions.length} questions filled
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
              {tab.speakingQuestions.every((q) => expandedSpeakingCards.has(q.id)) ? "Collapse All" : "Expand All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={addSubQuestion}
              disabled={tab.saved}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Question grid - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {tab.speakingQuestions.map((sq, idx) => {
            const isExpanded = expandedSpeakingCards.has(sq.id);
            return (
              <div
                key={sq.id}
                className={cn(
                  "border rounded-lg overflow-hidden",
                  isPart1 ? "border-emerald-200" : "border-violet-200",
                  isExpanded && "col-span-2"
                )}
              >
                {/* Question header - clickable to toggle */}
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer select-none",
                    isPart1 ? "bg-emerald-50 hover:bg-emerald-100" : "bg-violet-50 hover:bg-violet-100"
                  )}
                  onClick={() => toggleSpeakingCard(sq.id)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isExpanded ? (
                      <ChevronDown className={cn("h-3.5 w-3.5 shrink-0", isPart1 ? "text-emerald-600" : "text-violet-600")} />
                    ) : (
                      <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", isPart1 ? "text-emerald-600" : "text-violet-600")} />
                    )}
                    <span className={cn(
                      "text-xs font-semibold shrink-0",
                      isPart1 ? "text-emerald-700" : "text-violet-700"
                    )}>
                      Q{idx + 1}
                    </span>
                    {!isExpanded && (
                      <span className="text-xs text-muted-foreground truncate">
                        {getTextPreview(sq.text)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isExpanded && (
                      <>
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground">Time:</Label>
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
                          <span className="text-[10px] text-muted-foreground">s</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground">Re-record:</Label>
                          <Switch
                            checked={sq.allowResponseReset}
                            onCheckedChange={(v) => updateSubQuestion(sq.id, { allowResponseReset: v })}
                            disabled={tab.saved}
                            className="scale-75"
                          />
                        </div>
                      </>
                    )}
                    {tab.speakingQuestions.length > 1 && !tab.saved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSubQuestion(sq.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Question body - only shown when expanded */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    <RichTextEditor
                      value={sq.text}
                      onChange={(v) => updateSubQuestion(sq.id, { text: v })}
                      placeholder={isPart3
                        ? `Q${idx + 1}: e.g. Why do you think some people prefer reading books rather than watching movies?`
                        : `Q${idx + 1}: e.g. What do you do in your free time?`}
                      minHeight="60px"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0">Audio:</Label>
                      <div className="flex-1">
                        <FileUpload
                          value={sq.audioUrl}
                          onChange={(v) => updateSubQuestion(sq.id, { audioUrl: v })}
                          accept="audio"
                          placeholder="Upload examiner audio (optional)"
                          deferred
                          onFileReady={(file) => updateSubQuestion(sq.id, { audioFile: file })}
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
  };

  const renderSpeakingPart2 = () => (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="font-medium text-amber-900">Part 2: Cue Card</p>
        <p className="text-sm text-amber-700 mt-1">
          The candidate prepares for {tab.prepTimeSeconds || 60}s, then speaks for up to {tab.speakingTimeSeconds || 120}s on the given topic.
        </p>
      </div>

      {/* Cue Card Content */}
      <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
        <div className="bg-amber-100 px-4 py-2 border-b border-amber-200">
          <p className="text-sm font-semibold text-amber-800">Cue Card Content</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <RequiredLabel>Topic</RequiredLabel>
            <RichTextEditor
              value={tab.cueCardTopic}
              onChange={(v) => updateTab({ cueCardTopic: v })}
              placeholder="e.g. Describe a book that you have recently read."
              minHeight="80px"
              />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>You should say:</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => updateTab({ cueCardPoints: [...tab.cueCardPoints, ""] })}
                disabled={tab.saved || tab.cueCardPoints.length >= 6}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Point
              </Button>
            </div>
            {tab.cueCardPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{index + 1}.</span>
                <Input
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...tab.cueCardPoints];
                    newPoints[index] = e.target.value;
                    updateTab({ cueCardPoints: newPoints });
                  }}
                  placeholder={`Point ${index + 1}`}
                  disabled={tab.saved}
                  className="flex-1"
                />
                {tab.cueCardPoints.length > 1 && !tab.saved && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      const newPoints = tab.cueCardPoints.filter((_, i) => i !== index);
                      updateTab({ cueCardPoints: newPoints });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );

  // ─── Main render ──────────────────────────────────────────

  return (
    <div
      className={cn(
        "fixed top-0 left-[420px] h-full bg-white border-l shadow-xl z-50 transition-[width] duration-300 ease-in-out overflow-hidden",
        open ? "w-[calc(100vw-440px)]" : "w-0 border-l-0"
      )}
    >
      <div className="min-w-[calc(100vw-440px)] h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            새 문제 만들기 — {questionType.charAt(0).toUpperCase() + questionType.slice(1)}
          </h2>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
            onClick={handlePanelClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar - shown when at least one tab has a format selected */}
        {tabs.some((t) => t.selectedFormat) && renderTabBar()}

        {!tab.selectedFormat ? renderFormatSelection() : renderEditor()}
      </div>
    </div>
  );
}
