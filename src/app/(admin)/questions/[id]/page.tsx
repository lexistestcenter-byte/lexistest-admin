"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  Type,
  GripVertical,
  ListOrdered,
  GitBranch,
  FileText,
  CheckCircle2,
  X,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Loader2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "next/link";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import {
  QuestionType,
  QuestionFormat,
  questionFormats,
  Blank,
  MCQOption,
  MatchingOption,
  MatchingItem,
  FlowchartNode,
} from "@/components/questions/types";
import { FlowchartEditor } from "@/components/questions/flowchart-editor";
import { TableCompletionEditor } from "@/components/questions/table-completion-editor";
import { FillBlankEditor, FillBlankDragEditor } from "@/components/questions/fill-blank-editor";
import { QuestionPreview, tabToPreviewData, type QuestionPreviewData } from "@/components/questions/question-preview";
import { FileUpload } from "@/components/ui/file-upload";
import { api } from "@/lib/api/client";

// =============================================================================
// question_type 별 정보
// =============================================================================
const questionTypeInfo = [
  {
    id: "reading" as QuestionType,
    name: "Reading",
    nameKo: "읽기",
    icon: BookOpen,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  {
    id: "writing" as QuestionType,
    name: "Writing",
    nameKo: "쓰기",
    icon: PenTool,
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  {
    id: "listening" as QuestionType,
    name: "Listening",
    nameKo: "듣기",
    icon: Headphones,
    color: "bg-sky-50 text-sky-600 border-sky-200",
  },
  {
    id: "speaking" as QuestionType,
    name: "Speaking",
    nameKo: "말하기",
    icon: Mic,
    color: "bg-violet-50 text-violet-600 border-violet-200",
  },
];

// =============================================================================
// format별 아이콘 및 정보
// =============================================================================
const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: CheckCircle2,
  mcq_single: CheckCircle2,
  mcq_multiple: CheckCircle2,
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

// =============================================================================
// 메인 컴포넌트
// =============================================================================
export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { setOverride, clearOverride } = useBreadcrumb();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionCode, setQuestionCode] = useState("");

  // 문제 유형/형태 (수정 시에는 변경 불가)
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<QuestionFormat | null>(null);

  // 공통 필드
  const [instructions, setInstructions] = useState("");
  const [tags, setTags] = useState("");
  const [isPractice, setIsPractice] = useState(false);

  // 빈칸채우기 (직접입력 & 드래그앤드랍)
  const [contentHtml, setContentHtml] = useState("");
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [contentTitle, setContentTitle] = useState("");
  const [blankMode, setBlankMode] = useState<"word" | "sentence">("word");
  const [fillBlankDragAllowDuplicate, setFillBlankDragAllowDuplicate] = useState(false);

  // Table Completion
  const [tableInputMode, setTableInputMode] = useState<"typing" | "drag">("typing");

  // MCQ (통합: 단일/복수)
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([
    { id: "a", label: "A", text: "", isCorrect: false },
    { id: "b", label: "B", text: "", isCorrect: false },
    { id: "c", label: "C", text: "", isCorrect: false },
    { id: "d", label: "D", text: "", isCorrect: false },
  ]);
  const [mcqIsMultiple, setMcqIsMultiple] = useState(false);
  const [mcqMaxSelections, setMcqMaxSelections] = useState(2);

  // T/F/NG (단일 진술문)
  const [tfngStatement, setTfngStatement] = useState("");
  const [tfngAnswer, setTfngAnswer] = useState<"true" | "false" | "not_given">("true");

  // 매칭 (드래그앤드랍)
  const [matchingTitle, setMatchingTitle] = useState("");
  const [matchingAllowDuplicate, setMatchingAllowDuplicate] = useState(false);
  const [separateNumbers, setSeparateNumbers] = useState(false);
  const [matchingOptions, setMatchingOptions] = useState<MatchingOption[]>([
    { id: "o1", label: "A", text: "" },
    { id: "o2", label: "B", text: "" },
  ]);
  const [matchingItems, setMatchingItems] = useState<MatchingItem[]>([
    { id: "m1", number: 1, statement: "", correctLabel: "" },
  ]);

  // 플로우차트
  const [flowchartTitle, setFlowchartTitle] = useState("");
  const [flowchartNodes, setFlowchartNodes] = useState<FlowchartNode[]>([]);
  const [flowchartBlanks, setFlowchartBlanks] = useState<Blank[]>([]);

  // Writing
  const [writingTitle, setWritingTitle] = useState("");
  const [writingCondition, setWritingCondition] = useState("");
  const [writingPrompt, setWritingPrompt] = useState("");
  const [writingImageUrl, setWritingImageUrl] = useState("");
  const [writingMinWords, setWritingMinWords] = useState("");

  // Speaking
  const [speakingQuestion, setSpeakingQuestion] = useState("");
  const [cueCardTopic, setCueCardTopic] = useState("");
  const [cueCardPoints, setCueCardPoints] = useState<string[]>(["", "", "", ""]);
  const [cueCardImageUrl, setCueCardImageUrl] = useState("");
  const [generateFollowup, setGenerateFollowup] = useState(false);
  const [speakingCategory, setSpeakingCategory] = useState("");
  const [relatedPart2Id, setRelatedPart2Id] = useState("");
  const [depthLevel, setDepthLevel] = useState<1 | 2 | 3>(1);
  const [targetBandMin, setTargetBandMin] = useState("");
  const [targetBandMax, setTargetBandMax] = useState("");

  // Speaking 데이터 (카테고리, Part 2 목록)
  const [speakingCategories, setSpeakingCategories] = useState<{ id: string; code: string; name_en: string; name_ko?: string; display_order: number }[]>([]);
  const [part2Questions, setPart2Questions] = useState<{ id: string; question_code: string; topic: string }[]>([]);
  const [isLoadingSpeakingData, setIsLoadingSpeakingData] = useState(false);

  // Audio (Listening)
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");

  // Map Labeling
  const [mapLabelingTitle, setMapLabelingTitle] = useState("");
  const [mapLabelingPassage, setMapLabelingPassage] = useState("");
  const [mapLabelingImageUrl, setMapLabelingImageUrl] = useState("");
  const [mapLabelingLabels, setMapLabelingLabels] = useState<string[]>(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const [mapLabelingItems, setMapLabelingItems] = useState<{ id: string; number: number; statement: string; correctLabel: string }[]>([
    { id: "ml1", number: 1, statement: "", correctLabel: "" }
  ]);

  // 미리보기 모달
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ==========================================================================
  // 데이터 로드
  // ==========================================================================
  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const { data: result, error } = await api.get<{ question: any }>(`/api/questions/${id}`);
        if (error) {
          if (error.includes("404") || error.includes("not found")) {
            toast.error("문제를 찾을 수 없습니다.");
            router.push("/questions");
            return;
          }
          throw new Error(error);
        }
        const data = result?.question;

        if (!data) {
          toast.error("문제 데이터가 없습니다.");
          router.push("/questions");
          return;
        }

        // 기본 정보
        setQuestionCode(data.question_code);
        setSelectedQuestionType(data.question_type);
        setSelectedFormat(data.question_format);
        setInstructions(data.instructions || "");
        setTags(data.tags?.join(", ") || "");
        setIsPractice(data.is_practice);
        setGenerateFollowup(data.generate_followup);

        // 브레드크럼 설정
        setOverride(`/questions/${id}`, data.question_code);

        // 형식별 데이터 파싱
        const format = data.question_format;
        const content = data.content;
        const optionsData = data.options_data;
        const answerData = data.answer_data;
        const modelAnswers = data.model_answers;

        // Fill blank
        if (format === "fill_blank_typing" || format === "fill_blank_drag") {
          setContentTitle(data.title || "");
          setContentHtml(content);
          if (answerData?.blanks) {
            setBlanks(answerData.blanks.map((b: { number: number; answer: string; alternatives?: string[] }, idx: number) => ({
              id: `b${idx}`,
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives || [],
            })));
          }
          if (optionsData) {
            setBlankMode(optionsData.blank_mode || "word");

            if (format === "fill_blank_drag") {
              if (optionsData.word_bank) {
                setWordBank(optionsData.word_bank);
              }
              setFillBlankDragAllowDuplicate(optionsData.allow_duplicate || false);
            }
          }
        }
        // MCQ (단일/복수선택 → 통합 mcq로 변환)
        else if (format === "mcq_single" || format === "mcq_multiple") {
          // UI에서는 통합 mcq로 표시
          setSelectedFormat("mcq" as QuestionFormat);
          setMcqIsMultiple(format === "mcq_multiple");
          setMcqQuestion(content);
          if (optionsData) {
            if (optionsData.maxSelections) {
              setMcqMaxSelections(optionsData.maxSelections);
            }
            if (Array.isArray(optionsData.options)) {
              setMcqOptions(optionsData.options.map((o: { label: string; text: string; isCorrect: boolean }, idx: number) => ({
                id: `o${idx}`,
                label: o.label,
                text: o.text,
                isCorrect: o.isCorrect,
              })));
            }
          }
        }
        // T/F/NG
        else if (format === "true_false_ng") {
          setTfngStatement(content || "");
          if (answerData?.answer) {
            setTfngAnswer(answerData.answer as "true" | "false" | "not_given");
          }
        }
        // 매칭
        else if (format === "matching") {
          setContentHtml(content || "");
          if (optionsData) {
            setMatchingTitle(optionsData.title || "");
            setMatchingAllowDuplicate(optionsData.allowDuplicate || false);
            if (Array.isArray(optionsData.options)) {
              setMatchingOptions(optionsData.options.map((o: { label: string; text: string }, idx: number) => ({
                id: `o${idx}`,
                label: o.label,
                text: o.text,
              })));
            }
            if (Array.isArray(optionsData.items)) {
              setMatchingItems(optionsData.items.map((i: { number: number; statement: string; correctLabel: string }, idx: number) => ({
                id: `m${idx}`,
                number: i.number,
                statement: i.statement,
                correctLabel: i.correctLabel,
              })));
            }
          }
        }
        // Flowchart
        else if (format === "flowchart") {
          try {
            const parsed = JSON.parse(content);
            setFlowchartTitle(parsed.title || "");
            setFlowchartNodes(parsed.nodes || []);
          } catch {
            console.error("Failed to parse flowchart content");
          }
          if (answerData?.blanks) {
            setFlowchartBlanks(answerData.blanks.map((b: { number: number; answer: string; alternatives?: string[] }, idx: number) => ({
              id: `fb${idx}`,
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives || [],
            })));
          }
        }
        // Table Completion
        else if (format === "table_completion") {
          setContentTitle(data.title || "");
          setContentHtml(content);
          if (answerData?.blanks) {
            setBlanks(answerData.blanks.map((b: { number: number; answer: string; alternatives?: string[] }, idx: number) => ({
              id: `b${idx}`,
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives || [],
            })));
          }
          if (optionsData) {
            setBlankMode(optionsData.blank_mode || "word");
            setTableInputMode(optionsData.input_mode || "typing");
            if (optionsData.word_bank) {
              setWordBank(optionsData.word_bank);
            }
          }
        }
        // Writing
        else if (format === "essay") {
          setWritingPrompt(content || "");
          if (optionsData) {
            setWritingTitle(optionsData.title || "");
            setWritingCondition(optionsData.condition || "");
            setWritingImageUrl(optionsData.image_url || "");
            setWritingMinWords(optionsData.min_words ? String(optionsData.min_words) : "");
          }
        }
        // Speaking Part 1
        else if (format === "speaking_part1") {
          setSpeakingQuestion(content);
          setSpeakingCategory(data.speaking_category || "");
          setTargetBandMin(data.target_band_min ? String(data.target_band_min) : "");
          setTargetBandMax(data.target_band_max ? String(data.target_band_max) : "");
        }
        // Speaking Part 2
        else if (format === "speaking_part2") {
          try {
            const parsed = JSON.parse(content);
            setCueCardTopic(parsed.topic || "");
            setCueCardPoints(parsed.points || ["", "", "", ""]);
          } catch {
            setSpeakingQuestion(content);
          }
          if (optionsData?.image_url) {
            setCueCardImageUrl(optionsData.image_url);
          }
          setTargetBandMin(data.target_band_min ? String(data.target_band_min) : "");
          setTargetBandMax(data.target_band_max ? String(data.target_band_max) : "");
        }
        // Speaking Part 3
        else if (format === "speaking_part3") {
          setSpeakingQuestion(content);
          setRelatedPart2Id(data.related_part2_id || "");
          setDepthLevel((data.depth_level || 1) as 1 | 2 | 3);
          setTargetBandMin(data.target_band_min ? String(data.target_band_min) : "");
          setTargetBandMax(data.target_band_max ? String(data.target_band_max) : "");
        }
        // Map Labeling
        else if (format === "map_labeling") {
          if (optionsData) {
            setMapLabelingTitle(String(optionsData.title || data.title || ""));
            setMapLabelingPassage(data.content || "");
            setMapLabelingImageUrl(optionsData.image_url || "");
            if (Array.isArray(optionsData.labels)) {
              setMapLabelingLabels(optionsData.labels);
            }
            if (Array.isArray(optionsData.items)) {
              setMapLabelingItems(optionsData.items.map((i: { number: number; statement: string; correctLabel: string }, idx: number) => ({
                id: `ml${idx}`,
                number: i.number,
                statement: i.statement,
                correctLabel: i.correctLabel,
              })));
            }
          }
        }

        // separateNumbers (공통)
        if (optionsData?.separateNumbers) setSeparateNumbers(optionsData.separateNumbers);

        // Audio data (Listening)
        if (data.audio_url) setAudioUrl(data.audio_url);
        if (data.audio_transcript) setAudioTranscript(data.audio_transcript);
      } catch (error) {
        console.error("Error loading question:", error);
        toast.error("문제를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();

    return () => {
      clearOverride(`/questions/${id}`);
    };
  }, [id, router, setOverride, clearOverride]);

  // Speaking 카테고리 및 Part 2 질문 목록 로드
  useEffect(() => {
    if (selectedQuestionType === "speaking") {
      setIsLoadingSpeakingData(true);
      Promise.all([
        api.get<{ categories: any[] }>("/api/speaking/categories"),
        api.get<{ questions: any[] }>("/api/speaking/part2-questions"),
      ])
        .then(([categoriesRes, part2Res]) => {
          setSpeakingCategories(categoriesRes.data?.categories || []);
          setPart2Questions(part2Res.data?.questions || []);
        })
        .catch(err => {
          console.error("Failed to load speaking data:", err);
        })
        .finally(() => setIsLoadingSpeakingData(false));
    }
  }, [selectedQuestionType]);

  // ==========================================================================
  // 빈칸 관련 함수
  // ==========================================================================
  const addBlank = () => {
    const nextNumber = blanks.length > 0 ? Math.max(...blanks.map(b => b.number)) + 1 : 1;
    setBlanks([...blanks, { id: `b${Date.now()}`, number: nextNumber, answer: "", alternatives: [] }]);
  };

  const updateBlank = (id: string, field: keyof Blank, value: unknown) => {
    setBlanks(blanks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlank = (id: string) => {
    setBlanks(blanks.filter(b => b.id !== id));
  };

  // ==========================================================================
  // Word Bank 관련 함수
  // ==========================================================================
  const addWord = () => setWordBank([...wordBank, ""]);
  const cleanWord = (s: string) => s.trim();
  const updateWord = (index: number, value: string) => {
    const allowSpaces = selectedFormat === "table_completion";
    // 쉼표가 있으면 분리해서 각각 개별 단어로 추가
    const parts = value.split(",").map(cleanWord).filter(Boolean);
    if (parts.length > 1) {
      const valid = allowSpaces ? parts : parts.filter(p => !/\s/.test(p));
      const invalid = allowSpaces ? [] : parts.filter(p => /\s/.test(p));
      if (invalid.length > 0) toast.warning(`공백이 포함된 단어는 추가할 수 없습니다: ${invalid.join(", ")}`);
      if (valid.length > 0) {
        const newBank = [...wordBank];
        newBank[index] = valid[0];
        const extra = valid.slice(1).filter(w => !newBank.includes(w));
        setWordBank([...newBank, ...extra]);
      }
      return;
    }
    // 단일 단어: trim + 공백 검증
    const cleaned = cleanWord(value);
    if (!allowSpaces && cleaned && /\s/.test(cleaned)) {
      toast.warning("공백이 포함된 단어는 추가할 수 없습니다. 단일 단어만 입력해주세요.");
      return;
    }
    const newBank = [...wordBank];
    newBank[index] = cleaned;
    setWordBank(newBank);
  };
  const removeWord = (index: number) => setWordBank(wordBank.filter((_, i) => i !== index));

  // ==========================================================================
  // MCQ 관련 함수
  // ==========================================================================
  const addMcqOption = () => {
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[mcqOptions.length] || `O${mcqOptions.length + 1}`;
    setMcqOptions([...mcqOptions, { id: `o${Date.now()}`, label: nextLabel, text: "", isCorrect: false }]);
  };

  const removeMcqOption = (id: string) => {
    if (mcqOptions.length <= 2) {
      toast.error("최소 2개의 선택지가 필요합니다.");
      return;
    }
    const newOptions = mcqOptions.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    setMcqOptions(newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
  };

  const updateMcqOption = (id: string, field: keyof MCQOption, value: unknown) => {
    setMcqOptions(mcqOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const toggleMcqCorrect = (id: string, isMultiple: boolean) => {
    if (isMultiple) {
      setMcqOptions(mcqOptions.map(o => o.id === id ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      setMcqOptions(mcqOptions.map(o => ({ ...o, isCorrect: o.id === id })));
    }
  };

  // MCQ 모드 전환 시 입력 데이터 초기화
  const toggleMcqMode = (isMultiple: boolean) => {
    const hasData = mcqQuestion.trim() || mcqOptions.some(o => o.text.trim() || o.isCorrect);
    setMcqIsMultiple(isMultiple);
    if (hasData) {
      setMcqQuestion("");
      setMcqOptions([
        { id: "a", label: "A", text: "", isCorrect: false },
        { id: "b", label: "B", text: "", isCorrect: false },
        { id: "c", label: "C", text: "", isCorrect: false },
        { id: "d", label: "D", text: "", isCorrect: false },
      ]);
      setMcqMaxSelections(2);
      toast.info("선택 방식이 변경되어 입력 내용이 초기화되었습니다.");
    }
  };

  // ==========================================================================
  // 매칭 관련 함수
  // ==========================================================================
  const addMatchingOption = () => {
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[matchingOptions.length] || `O${matchingOptions.length + 1}`;
    setMatchingOptions([...matchingOptions, { id: `o${Date.now()}`, label: nextLabel, text: "" }]);
  };

  const removeMatchingOption = (id: string) => {
    if (matchingOptions.length <= 2) {
      toast.error("최소 2개의 보기가 필요합니다.");
      return;
    }
    const newOptions = matchingOptions.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    setMatchingOptions(newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
  };

  const updateMatchingOption = (id: string, text: string) => {
    setMatchingOptions(matchingOptions.map(o => o.id === id ? { ...o, text } : o));
  };

  const addMatchingItem = () => {
    const nextNum = matchingItems.length > 0 ? Math.max(...matchingItems.map(i => i.number)) + 1 : 1;
    setMatchingItems([...matchingItems, { id: `m${Date.now()}`, number: nextNum, statement: "", correctLabel: "" }]);
  };

  const updateMatchingItem = (id: string, field: keyof MatchingItem, value: unknown) => {
    setMatchingItems(matchingItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeMatchingItem = (id: string) => {
    if (matchingItems.length <= 1) {
      toast.error("최소 1개의 문항이 필요합니다.");
      return;
    }
    setMatchingItems(matchingItems.filter(i => i.id !== id));
  };

  // ==========================================================================
  // 플로우차트 관련 함수
  // ==========================================================================
  const addFlowchartNode = (type: "box" | "branch") => {
    const maxRow = flowchartNodes.reduce((max, n) => Math.max(max, n.row), -1);
    setFlowchartNodes([...flowchartNodes, {
      id: `n${Date.now()}`,
      type,
      content: "",
      row: maxRow + 1,
      col: 0,
      label: "",
    }]);
  };

  // ==========================================================================
  // 저장 핸들러
  // ==========================================================================
  const handleSave = async () => {
    if (!selectedQuestionType || !selectedFormat) {
      toast.error("문제 유형과 형태가 필요합니다.");
      return;
    }

    // MCQ 유효성 검사
    if (selectedFormat === "mcq") {
      const emptyOptions = mcqOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        toast.error("모든 선택지를 입력해주세요.");
        return;
      }
      const correctCount = mcqOptions.filter(o => o.isCorrect).length;
      if (correctCount === 0) {
        toast.error("정답을 선택해주세요.");
        return;
      }
      if (mcqIsMultiple && correctCount !== mcqMaxSelections) {
        toast.error(`복수선택 개수(${mcqMaxSelections}개)만큼 정답을 선택해주세요.`);
        return;
      }
      if (!mcqQuestion.trim()) {
        toast.error("문제를 입력해주세요.");
        return;
      }
    }

    // T/F/NG 유효성 검사
    if (selectedFormat === "true_false_ng") {
      if (!tfngStatement.trim()) {
        toast.error("진술문을 입력해주세요.");
        return;
      }
    }

    // 매칭 유효성 검사
    if (selectedFormat === "matching") {
      if (!contentHtml.trim()) {
        toast.error("지문을 입력하세요.");
        return;
      }
      const emptyOptions = matchingOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        const labels = emptyOptions.map(o => o.label).join(", ");
        toast.error(`제목 ${labels}의 텍스트를 입력하세요.`);
        return;
      }
      // 지문에서 섹션 번호 파싱
      const sectionText = contentHtml.replace(/<[^>]*>/g, "");
      const sectionNums: number[] = [];
      const sectionRe = /\[(\d+)\]/g;
      let sm;
      while ((sm = sectionRe.exec(sectionText)) !== null) sectionNums.push(parseInt(sm[1]));
      const uniqueSections = [...new Set(sectionNums)];
      if (uniqueSections.length === 0) {
        toast.error("지문에 섹션 마커 [1], [2] 등을 추가하세요.");
        return;
      }
      const assignedSections = new Set(matchingItems.map(i => i.number));
      const unassigned = uniqueSections.filter(n => !assignedSections.has(n));
      if (unassigned.length > 0) {
        toast.error(`섹션 [${unassigned.join("], [")}]에 정답 제목을 지정하세요.`);
        return;
      }
    }

    // 빈칸채우기 유효성 검사
    if (selectedFormat === "fill_blank_typing" || selectedFormat === "fill_blank_drag") {
      if (!contentHtml.trim()) {
        toast.error("지문을 입력해주세요.");
        return;
      }
      if (blanks.length === 0) {
        toast.error("빈칸을 추가해주세요.");
        return;
      }
      const emptyBlanks = blanks.filter(b => !b.answer.trim());
      if (emptyBlanks.length > 0) {
        toast.error("모든 빈칸의 정답을 입력해주세요.");
        return;
      }
    }

    // 플로우차트 유효성 검사
    if (selectedFormat === "flowchart") {
      if (!flowchartTitle.trim()) {
        toast.error("플로우차트 제목을 입력해주세요.");
        return;
      }
    }

    // Writing(에세이) 유효성 검사
    if (selectedFormat === "essay") {
      if (!writingPrompt.trim()) {
        toast.error("작문 프롬프트를 입력해주세요.");
        return;
      }
    }

    // Speaking 유효성 검사
    if (selectedFormat === "speaking_part1") {
      if (!speakingQuestion.trim()) {
        toast.error("질문을 입력해주세요.");
        return;
      }
      if (!speakingCategory) {
        toast.error("카테고리를 선택해주세요.");
        return;
      }
    }

    if (selectedFormat === "speaking_part2") {
      if (!cueCardTopic.trim()) {
        toast.error("큐카드 주제를 입력해주세요.");
        return;
      }
    }

    if (selectedFormat === "speaking_part3") {
      if (!speakingQuestion.trim()) {
        toast.error("질문을 입력해주세요.");
        return;
      }
      if (!relatedPart2Id) {
        toast.error("연결된 Part 2 질문을 선택해주세요.");
        return;
      }
    }

    // Speaking Band 범위 검증
    if (selectedFormat === "speaking_part1" || selectedFormat === "speaking_part2" || selectedFormat === "speaking_part3") {
      if (targetBandMin && targetBandMax) {
        if (parseFloat(targetBandMin) > parseFloat(targetBandMax)) {
          toast.error("목표 Band 최소값이 최대값보다 클 수 없습니다.");
          return;
        }
      }
    }

    // 테이블 완성하기 유효성 검사
    if (selectedFormat === "table_completion") {
      if (!contentHtml.trim()) {
        toast.error("테이블 지문을 입력해주세요.");
        return;
      }
      if (blanks.length === 0) {
        toast.error("빈칸을 추가해주세요.");
        return;
      }
      const emptyBlanks = blanks.filter(b => !b.answer.trim());
      if (emptyBlanks.length > 0) {
        toast.error("모든 빈칸의 정답을 입력해주세요.");
        return;
      }
    }

    // Map Labeling 유효성 검사
    if (selectedFormat === "map_labeling") {
      if (!mapLabelingImageUrl.trim()) {
        toast.error("지도/이미지 URL을 입력해주세요.");
        return;
      }
      if (mapLabelingItems.length === 0) {
        toast.error("문제 항목을 추가해주세요.");
        return;
      }
      const emptyItems = mapLabelingItems.filter(i => !i.statement.trim() || !i.correctLabel);
      if (emptyItems.length > 0) {
        toast.error("모든 문제 항목과 정답 라벨을 입력해주세요.");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Build question content based on format
      let content = "";
      let optionsData = null;
      let answerData = null;
      let modelAnswers = null;
      // 실제 저장할 format (MCQ의 경우 isMultiple에 따라 결정)
      let actualFormat: string = selectedFormat;

      // Fill blank
      if (selectedFormat === "fill_blank_typing" || selectedFormat === "fill_blank_drag") {
        content = contentHtml;
        answerData = {
          blanks: blanks.map(b => ({
            number: b.number,
            answer: b.answer,
            alternatives: b.alternatives || [],
          })),
        };
        optionsData = {
          blank_mode: blankMode,
          ...(selectedFormat === "fill_blank_drag" ? { word_bank: wordBank, allow_duplicate: fillBlankDragAllowDuplicate } : {}),
        };
      }
      // MCQ (통합: 단일/복수)
      else if (selectedFormat === "mcq") {
        // 저장 시 isMultiple에 따라 실제 format 결정
        actualFormat = mcqIsMultiple ? "mcq_multiple" : "mcq_single";
        content = mcqQuestion;
        optionsData = {
          isMultiple: mcqIsMultiple,
          ...(mcqIsMultiple ? { maxSelections: mcqMaxSelections } : {}),
          options: mcqOptions.map(o => ({
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        };
        if (mcqIsMultiple) {
          const correctOptions = mcqOptions.filter(o => o.isCorrect);
          answerData = { correct: correctOptions.map(o => o.label) };
        } else {
          const correctOption = mcqOptions.find(o => o.isCorrect);
          answerData = { correct: correctOption?.label || "" };
        }
      }
      // T/F/NG
      else if (selectedFormat === "true_false_ng") {
        content = tfngStatement;
        answerData = {
          answer: tfngAnswer,
        };
      }
      // 매칭
      else if (selectedFormat === "matching") {
        content = contentHtml;
        optionsData = {
          title: matchingTitle || null,
          allowDuplicate: matchingAllowDuplicate,
          options: matchingOptions.map(o => ({
            label: o.label,
            text: o.text,
          })),
          items: matchingItems.map(i => ({
            number: i.number,
            statement: i.statement,
            correctLabel: i.correctLabel,
          })),
        };
        answerData = {
          matches: matchingItems.map(i => ({ number: i.number, correctLabel: i.correctLabel })),
        };
      }
      // Flowchart
      else if (selectedFormat === "flowchart") {
        content = JSON.stringify({ title: flowchartTitle, nodes: flowchartNodes });
        answerData = {
          blanks: flowchartBlanks.map(b => ({
            number: b.number,
            answer: b.answer,
            alternatives: b.alternatives || [],
          })),
        };
      }
      // Table Completion
      else if (selectedFormat === "table_completion") {
        content = contentHtml;
        optionsData = {
          title: contentTitle || undefined,
          blank_mode: blankMode,
          input_mode: tableInputMode,
          ...(tableInputMode === "drag" ? { word_bank: wordBank } : {}),
        };
        answerData = {
          blanks: blanks.map(b => ({
            number: b.number,
            answer: b.answer,
            alternatives: b.alternatives || [],
          })),
        };
      }
      // Writing
      else if (selectedFormat === "essay") {
        content = writingPrompt;
        optionsData = {
          title: writingTitle || null,
          condition: writingCondition || null,
          image_url: writingImageUrl || null,
          min_words: writingMinWords ? parseInt(writingMinWords) : null,
        };
      }
      // Speaking Part 1
      else if (selectedFormat === "speaking_part1") {
        content = speakingQuestion;
      }
      // Speaking Part 2
      else if (selectedFormat === "speaking_part2") {
        content = JSON.stringify({
          topic: cueCardTopic,
          points: cueCardPoints,
        });
        optionsData = {
          generate_followup: generateFollowup,
          image_url: cueCardImageUrl || null,
        };
      }
      // Speaking Part 3
      else if (selectedFormat === "speaking_part3") {
        content = speakingQuestion;
      }
      // Map Labeling
      else if (selectedFormat === "map_labeling") {
        content = mapLabelingPassage || " ";
        optionsData = {
          title: mapLabelingTitle || undefined,
          image_url: mapLabelingImageUrl,
          labels: mapLabelingLabels,
          items: mapLabelingItems.map(i => ({
            number: i.number,
            statement: i.statement,
            correctLabel: i.correctLabel,
          })),
        };
        answerData = {
          items: mapLabelingItems.map(i => ({
            number: i.number,
            correctLabel: i.correctLabel,
          })),
        };
      }

      // separateNumbers를 multi-item 유형에 공통 추가
      if ([
        "true_false_ng", "matching", "heading_matching",
        "fill_blank_typing", "fill_blank_drag",
        "flowchart", "table_completion", "map_labeling",
      ].includes(selectedFormat!) || (selectedFormat === "mcq" && mcqIsMultiple)) {
        optionsData = { ...optionsData, separateNumbers };
      }

      const questionData = {
        question_type: selectedQuestionType,
        question_format: actualFormat,
        content,
        title: contentTitle || flowchartTitle || mapLabelingTitle || null,
        instructions: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng") ? (instructions || null) : null,
        options_data: optionsData,
        answer_data: answerData,
        model_answers: modelAnswers,
        generate_followup: generateFollowup,
        is_practice: isPractice,
        tags: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng") && tags ? tags.split(",").map(t => t.trim()) : null,
        // Audio fields (Listening & Speaking)
        audio_url: (selectedQuestionType === "listening" || selectedQuestionType === "speaking") && audioUrl ? audioUrl : null,
        audio_transcript: (selectedQuestionType === "listening" || selectedQuestionType === "speaking") && audioTranscript ? audioTranscript : null,
        // Speaking fields
        speaking_category: selectedFormat === "speaking_part1" ? (speakingCategory || null) : null,
        related_part2_id: selectedFormat === "speaking_part3" ? (relatedPart2Id || null) : null,
        depth_level: selectedFormat === "speaking_part3" ? depthLevel : null,
        target_band_min: (selectedFormat === "speaking_part1" || selectedFormat === "speaking_part2" || selectedFormat === "speaking_part3")
          ? (targetBandMin ? parseFloat(targetBandMin) : null)
          : null,
        target_band_max: (selectedFormat === "speaking_part1" || selectedFormat === "speaking_part2" || selectedFormat === "speaking_part3")
          ? (targetBandMax ? parseFloat(targetBandMax) : null)
          : null,
      };

      const { error } = await api.put(`/api/questions/${id}`, questionData);

      if (error) {
        throw new Error(error);
      }

      toast.success("문제가 수정되었습니다.");
      router.push("/questions");
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error(
        error instanceof Error ? error.message : "문제 수정에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // 삭제 핸들러
  // ==========================================================================
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await api.delete(`/api/questions/${id}`);

      if (error) {
        throw new Error(error);
      }

      toast.success("문제가 삭제되었습니다.");
      router.push("/questions");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("문제 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // ==========================================================================
  // 렌더링
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedQuestionType || !selectedFormat) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">문제 데이터를 불러올 수 없습니다.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/questions">목록으로</Link>
        </Button>
      </div>
    );
  }

  const currentTypeInfo = questionTypeInfo.find(t => t.id === selectedQuestionType);
  const currentFormat = questionFormats[selectedQuestionType]?.find(f => f.value === selectedFormat);

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/questions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{questionCode}</span>
            {currentTypeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentTypeInfo.color}`}>
                {currentTypeInfo.name}
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-sm">{currentFormat?.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            미리보기
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 설정 패널 */}
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

              {/* 별도 문항 번호 토글 — multi-item 유형 공통 */}
              {selectedFormat && ([
                "true_false_ng", "matching", "heading_matching",
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

            </div>

            {/* Audio Settings (Listening & Speaking) */}
            {(selectedQuestionType === "listening" || selectedQuestionType === "speaking") && (
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

            {/* 유형별 추가 설정 */}
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

            {/* Speaking Part 2: AI 심화질문 생성 옵션 */}
            {selectedFormat === "speaking_part2" && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">AI 심화질문 생성</Label>
                  <p className="text-xs text-muted-foreground">Part 2 답변 후 AI가 추가 질문</p>
                </div>
                <input
                  type="checkbox"
                  checked={generateFollowup}
                  onChange={(e) => setGenerateFollowup(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 에디터 영역 */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
            {/* MCQ (통합: 단일/복수) */}
            {selectedFormat === "mcq" && (
              <MCQEditor
                question={mcqQuestion}
                setQuestion={setMcqQuestion}
                options={mcqOptions}
                addOption={addMcqOption}
                removeOption={removeMcqOption}
                updateOption={updateMcqOption}
                toggleCorrect={(id) => toggleMcqCorrect(id, mcqIsMultiple)}
                isMultiple={mcqIsMultiple}
                setIsMultiple={toggleMcqMode}
                maxSelections={mcqMaxSelections}
                setMaxSelections={setMcqMaxSelections}
              />
            )}

            {/* T/F/NG */}
            {selectedFormat === "true_false_ng" && (
              <TFNGEditor
                statement={tfngStatement}
                setStatement={setTfngStatement}
                answer={tfngAnswer}
                setAnswer={setTfngAnswer}
              />
            )}

            {/* 매칭 */}
            {selectedFormat === "matching" && (
              <MatchingEditor
                title={matchingTitle}
                setTitle={setMatchingTitle}
                content={contentHtml}
                setContent={setContentHtml}
                allowDuplicate={matchingAllowDuplicate}
                setAllowDuplicate={setMatchingAllowDuplicate}
                options={matchingOptions}
                addOption={addMatchingOption}
                removeOption={removeMatchingOption}
                updateOption={updateMatchingOption}
                items={matchingItems}
                setItems={setMatchingItems}
              />
            )}

            {/* 빈칸채우기 (직접입력) */}
            {selectedFormat === "fill_blank_typing" && (
              <FillBlankEditor
                title={contentTitle}
                setTitle={setContentTitle}
                content={contentHtml}
                setContent={setContentHtml}
                blanks={blanks}
                setBlanks={setBlanks}
                blankMode={blankMode}
                setBlankMode={setBlankMode}
              />
            )}

            {/* 빈칸채우기 (드래그앤드랍) */}
            {selectedFormat === "fill_blank_drag" && (
              <FillBlankDragEditor
                title={contentTitle}
                setTitle={setContentTitle}
                content={contentHtml}
                setContent={setContentHtml}
                blanks={blanks}
                setBlanks={setBlanks}
                wordBank={wordBank}
                setWordBank={setWordBank}
                blankMode={blankMode}
                setBlankMode={setBlankMode}
                allowDuplicate={fillBlankDragAllowDuplicate}
                setAllowDuplicate={setFillBlankDragAllowDuplicate}
              />
            )}

            {/* 테이블 완성하기 */}
            {selectedFormat === "table_completion" && (
              <TableCompletionEditor
                title={contentTitle}
                setTitle={setContentTitle}
                content={contentHtml}
                setContent={setContentHtml}
                blanks={blanks}
                setBlanks={setBlanks}
                wordBank={wordBank}
                setWordBank={setWordBank}
                blankMode={blankMode}
                setBlankMode={setBlankMode}
                inputMode={tableInputMode}
                setInputMode={setTableInputMode}
              />
            )}

            {/* 플로우차트 */}
            {selectedFormat === "flowchart" && (
              <FlowchartEditor
                title={flowchartTitle}
                setTitle={setFlowchartTitle}
                nodes={flowchartNodes}
                setNodes={setFlowchartNodes}
                addNode={addFlowchartNode}
                blanks={flowchartBlanks}
                setBlanks={setFlowchartBlanks}
                updateBlank={(id, field, value) => {
                  setFlowchartBlanks(flowchartBlanks.map(b => b.id === id ? { ...b, [field]: value } : b));
                }}
                instructions={instructions}
                setInstructions={setInstructions}
              />
            )}

            {/* Writing */}
            {selectedFormat === "essay" && (
              <WritingEditor
                title={writingTitle}
                setTitle={setWritingTitle}
                condition={writingCondition}
                setCondition={setWritingCondition}
                prompt={writingPrompt}
                setPrompt={setWritingPrompt}
                imageUrl={writingImageUrl}
                setImageUrl={setWritingImageUrl}
                minWords={writingMinWords}
                setMinWords={setWritingMinWords}
                questionCode={questionCode}
              />
            )}

            {/* Speaking Part 1 */}
            {selectedFormat === "speaking_part1" && (
              <SpeakingPart1EditorEdit
                question={speakingQuestion}
                setQuestion={setSpeakingQuestion}
                category={speakingCategory}
                setCategory={setSpeakingCategory}
                categories={speakingCategories}
                targetBandMin={targetBandMin}
                setTargetBandMin={setTargetBandMin}
                targetBandMax={targetBandMax}
                setTargetBandMax={setTargetBandMax}
                isLoading={isLoadingSpeakingData}
              />
            )}

            {/* Speaking Part 2 */}
            {selectedFormat === "speaking_part2" && (
              <SpeakingPart2EditorEdit
                topic={cueCardTopic}
                setTopic={setCueCardTopic}
                points={cueCardPoints}
                setPoints={setCueCardPoints}
                imageUrl={cueCardImageUrl}
                setImageUrl={setCueCardImageUrl}
                targetBandMin={targetBandMin}
                setTargetBandMin={setTargetBandMin}
                targetBandMax={targetBandMax}
                setTargetBandMax={setTargetBandMax}
                questionCode={questionCode}
              />
            )}

            {/* Speaking Part 3 */}
            {selectedFormat === "speaking_part3" && (
              <SpeakingPart3EditorEdit
                question={speakingQuestion}
                setQuestion={setSpeakingQuestion}
                relatedPart2Id={relatedPart2Id}
                setRelatedPart2Id={setRelatedPart2Id}
                part2Questions={part2Questions}
                depthLevel={depthLevel}
                setDepthLevel={setDepthLevel}
                targetBandMin={targetBandMin}
                setTargetBandMin={setTargetBandMin}
                targetBandMax={targetBandMax}
                setTargetBandMax={setTargetBandMax}
                isLoading={isLoadingSpeakingData}
              />
            )}

            {/* Map Labeling */}
            {selectedFormat === "map_labeling" && (
              <MapLabelingEditor
                title={mapLabelingTitle}
                setTitle={setMapLabelingTitle}
                passage={mapLabelingPassage}
                setPassage={setMapLabelingPassage}
                imageUrl={mapLabelingImageUrl}
                setImageUrl={setMapLabelingImageUrl}
                labels={mapLabelingLabels}
                setLabels={setMapLabelingLabels}
                items={mapLabelingItems}
                setItems={setMapLabelingItems}
                questionCode={questionCode}
              />
            )}

          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문제 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 문제를 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{questionCode}</strong>
              <br /><br />
              <span className="text-amber-600">
                이 문제가 포함된 그룹이나 섹션에서 제거됩니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 미리보기 모달 */}
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        questionType={selectedQuestionType}
        previewData={selectedFormat ? tabToPreviewData({
          format: selectedFormat,
          mcqQuestion, mcqOptions, mcqIsMultiple, mcqMaxSelections,
          tfngStatement,
          matchingTitle, matchingAllowDuplicate, matchingOptions,
          contentTitle, contentHtml, blanks, wordBank,
          fillBlankDragAllowDuplicate,
          tableInputMode,
          flowchartTitle, flowchartNodes,
          writingTitle, writingCondition, writingPrompt, writingImageUrl, writingMinWords,
          speakingQuestion, cueCardTopic, cueCardPoints, cueCardImageUrl: "",
          speakingCategory: "", relatedPart2Id: "", depthLevel: 1,
          targetBandMin: "", targetBandMax: "",
          audioUrl,
          mapLabelingTitle, mapLabelingPassage,
          mapLabelingImageUrl,
          mapLabelingLabels,
          mapLabelingItems,
          instructions,
          blankMode,
        }, selectedQuestionType || "") : null}
      />
    </div>
  );
}

// FillBlankEditor and FillBlankDragEditor imported from @/components/questions/fill-blank-editor

// =============================================================================
// MCQ 에디터 (단일선택/복수선택 통합)
// =============================================================================
function MCQEditor({
  question, setQuestion, options, addOption, removeOption, updateOption, toggleCorrect,
  isMultiple, setIsMultiple, maxSelections, setMaxSelections
}: {
  question: string;
  setQuestion: (v: string) => void;
  options: MCQOption[];
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, field: keyof MCQOption, value: unknown) => void;
  toggleCorrect: (id: string) => void;
  isMultiple: boolean;
  setIsMultiple: (v: boolean) => void;
  maxSelections: number;
  setMaxSelections: (v: number) => void;
}) {
  const correctCount = options.filter(o => o.isCorrect).length;
  // 선택지 개수에 따라 정답 개수 옵션 제한
  const maxSelectableCount = Math.min(options.length, 5);

  return (
    <div className="space-y-6">
      {/* 단일/복수 선택 모드 스위치 */}
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">복수 선택 모드</Label>
            <p className="text-sm text-muted-foreground">
              {isMultiple ? "여러 개의 정답을 선택할 수 있습니다" : "하나의 정답만 선택할 수 있습니다"}
            </p>
          </div>
          <Switch
            checked={isMultiple}
            onCheckedChange={setIsMultiple}
          />
        </div>
      </div>

      {isMultiple && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4">
            <Label className="text-sm">정답 개수:</Label>
            <Select value={maxSelections.toString()} onValueChange={(v) => setMaxSelections(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxSelectableCount - 1 }, (_, i) => i + 2).map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}개</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">(현재 선택: {correctCount}개)</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <RequiredLabel required>문제</RequiredLabel>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="예: Which TWO of the following statements are true?"
          minHeight="80px"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <RequiredLabel required>선택지</RequiredLabel>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="mr-2 h-4 w-4" />
            선택지 추가
          </Button>
        </div>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 flex items-center justify-center font-medium cursor-pointer transition-all ${isMultiple
                ? `rounded border-2 ${option.isCorrect ? "border-green-500 bg-green-500 text-white" : "border-slate-300 hover:border-primary"}`
                : `rounded-full border-2 ${option.isCorrect ? "border-green-500 bg-green-500 text-white ring-2 ring-green-200" : "border-slate-300 hover:border-primary hover:bg-primary/10"}`
                }`}
              onClick={() => toggleCorrect(option.id)}
            >
              {option.label}
            </div>
            <Input
              value={option.text}
              onChange={(e) => updateOption(option.id, "text", e.target.value)}
              placeholder={`선택지 ${option.label}`}
              className="flex-1"
            />
            {option.isCorrect && <span className="text-xs text-green-600 font-medium">정답</span>}
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// T/F/NG 에디터
// =============================================================================
function TFNGEditor({
  statement, setStatement, answer, setAnswer
}: {
  statement: string;
  setStatement: (v: string) => void;
  answer: "true" | "false" | "not_given";
  setAnswer: (v: "true" | "false" | "not_given") => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <RequiredLabel required>문항 제목</RequiredLabel>
        <RichTextEditor
          value={statement}
          onChange={setStatement}
          placeholder="예: The number of students increased significantly in 2020."
          minHeight="80px"
        />
      </div>

      <div className="space-y-3">
        <Label>정답</Label>
        <div className="flex gap-3">
          {(["true", "false", "not_given"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer(opt)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all border-2 ${answer === opt
                ? "bg-primary text-white border-primary"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
            >
              {opt === "true" ? "TRUE" : opt === "false" ? "FALSE" : "NOT GIVEN"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 제목 매칭 에디터
// =============================================================================
function MatchingEditor({
  title, setTitle, content, setContent,
  allowDuplicate, setAllowDuplicate,
  options, addOption, removeOption, updateOption,
  items, setItems,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  allowDuplicate: boolean; setAllowDuplicate: (v: boolean) => void;
  options: MatchingOption[];
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, text: string) => void;
  items: MatchingItem[]; setItems: (v: MatchingItem[]) => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // 지문에서 [N] 섹션 번호 파싱
  const sectionNums = (() => {
    const text = content.replace(/<[^>]*>/g, "");
    const nums: number[] = [];
    const re = /\[(\d+)\]/g;
    let m;
    while ((m = re.exec(text)) !== null) nums.push(parseInt(m[1]));
    return [...new Set(nums)].sort((a, b) => a - b);
  })();

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      // [N] 삭제 시 해당 항목 정리
      const text = editor.state.doc.textContent;
      const re = /\[(\d+)\]/g;
      const foundNums = new Set<number>();
      let match;
      while ((match = re.exec(text)) !== null) foundNums.add(parseInt(match[1]));
      const curr = itemsRef.current;
      const filtered = curr.filter(i => foundNums.has(i.number));
      if (filtered.length !== curr.length) setItems(filtered);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2 [&_p]:my-1 [&_strong]:font-bold",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editor) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const insertSectionMarker = () => {
    if (!editor) return;
    const nextNum = sectionNums.length > 0 ? Math.max(...sectionNums) + 1 : 1;
    editor.chain().focus().insertContent(`[${nextNum}]`).run();
    setContextMenu(null);
  };

  // 제목 → 섹션 매핑 조회/설정
  const getHeadingSectionNum = (label: string): number | null => {
    const item = items.find(i => i.correctLabel === label);
    return item ? item.number : null;
  };

  const setHeadingSectionNum = (label: string, sectionNum: number | null) => {
    let updated = items.filter(i => i.correctLabel !== label);
    if (sectionNum !== null) {
      if (!allowDuplicate) {
        updated = updated.filter(i => i.number !== sectionNum);
      }
      updated.push({ id: `m${Date.now()}-${sectionNum}`, number: sectionNum, statement: "", correctLabel: label });
    }
    updated.sort((a, b) => a.number - b.number);
    setItems(updated);
  };

  const assignedSections = new Set(items.map(i => i.number));
  const unassignedSections = sectionNums.filter(n => !assignedSections.has(n));

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>
      {/* ── 지문 입력 ── */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label>지문 제목</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" />
        </div>
        <div className="space-y-2">
          <Label>지문 내용 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">
            섹션 시작 위치에서 <strong>우클릭</strong> → 섹션 마커 삽입 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
          </p>
          <p className="text-xs text-muted-foreground">
            문제 내용은 왼쪽에 표시 됩니다.
          </p>
          <div className="relative">
            <div className="border rounded-md overflow-hidden" onContextMenu={handleContextMenu}>
              <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("bold") ? "bg-slate-200" : ""}`}
                ><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("italic") ? "bg-slate-200" : ""}`}
                ><Italic className="h-4 w-4" /></Button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: "left" }) ? "bg-slate-200" : ""}`}
                ><AlignLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: "center" }) ? "bg-slate-200" : ""}`}
                ><AlignCenter className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: "right" }) ? "bg-slate-200" : ""}`}
                ><AlignRight className="h-4 w-4" /></Button>
              </div>
              <EditorContent editor={editor} className="bg-white" />
            </div>
            {contextMenu && (
              <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[180px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  onClick={insertSectionMarker}>
                  <Plus className="h-4 w-4" />
                  섹션 마커 삽입 [{sectionNums.length > 0 ? Math.max(...sectionNums) + 1 : 1}]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 제목 목록 (List of Headings) ── */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>제목 목록 (List of Headings) <span className="text-red-500">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5">정답 제목과 오답(함정) 제목을 모두 추가하세요.</p>
            <p className="text-xs text-muted-foreground mt-0.5">제목 목록은 오른쪽에 표시되는 내용 입니다.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            제목 추가
          </Button>
        </div>
        <div className="border rounded-lg divide-y">
          {options.map((option) => {
            const assignedNum = getHeadingSectionNum(option.label);
            return (
              <div key={option.id} className="flex items-center gap-2 px-3 py-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {option.label}
                </span>
                <Input className="flex-1 h-8 text-sm" value={option.text} onChange={(e) => updateOption(option.id, e.target.value)} placeholder={`제목 ${option.label} 입력`} />
                <Select
                  value={assignedNum !== null ? String(assignedNum) : "distractor"}
                  onValueChange={(v) => setHeadingSectionNum(option.label, v === "distractor" ? null : parseInt(v))}
                >
                  <SelectTrigger className={`w-28 h-8 text-xs shrink-0 ${assignedNum !== null ? "border-green-300 bg-green-50 text-green-700" : "border-slate-200 text-muted-foreground"}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distractor">오답</SelectItem>
                    {sectionNums.map(num => (
                      <SelectItem key={num} value={String(num)}>섹션 [{num}]</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeOption(option.id)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {unassignedSections.length > 0 && (
          <p className="text-xs text-amber-600">
            ⚠ 정답이 지정되지 않은 섹션: [{unassignedSections.join("], [")}]
          </p>
        )}

        <div className="flex items-center gap-3 pt-2 border-t">
          <Switch checked={allowDuplicate} onCheckedChange={setAllowDuplicate} />
          <Label className="text-xs text-muted-foreground">같은 제목 중복 사용 허용</Label>
        </div>
      </div>
    </div>
  );
}



// =============================================================================
// Writing 에디터
// =============================================================================
function WritingEditor({
  title, setTitle,
  condition, setCondition,
  prompt, setPrompt,
  imageUrl, setImageUrl,
  minWords, setMinWords,
  questionCode,
}: {
  title: string;
  setTitle: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  minWords: string;
  setMinWords: (v: string) => void;
  questionCode?: string;
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
          <Label>최소 단어 수 (선택)</Label>
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

      {/* 조건 (시간/단어수) */}
      <div className="space-y-2">
        <RequiredLabel required>조건 (시간/단어수)</RequiredLabel>
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

      {/* 이미지 (선택 - Task 1 그래프/차트용) */}
      <div className="space-y-2">
        <Label>이미지 (선택 - Task 1 그래프/차트용)</Label>
        <FileUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          placeholder="Task 1 그래프/차트 이미지 업로드"
          context={questionCode ? `questions/${questionCode}` : undefined}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 1 에디터
// =============================================================================
function SpeakingPart1EditorEdit({
  question,
  setQuestion,
  category,
  setCategory,
  categories,
  targetBandMin,
  setTargetBandMin,
  targetBandMax,
  setTargetBandMax,
  isLoading,
}: {
  question: string;
  setQuestion: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categories: { id: string; code: string; name_en: string; name_ko?: string }[];
  targetBandMin: string;
  setTargetBandMin: (v: string) => void;
  targetBandMax: string;
  setTargetBandMax: (v: string) => void;
  isLoading?: boolean;
}) {
  const bandOptions = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          Part 1: 일상적인 주제에 대한 질문입니다. 학생은 30초~1분 정도의 짧은 답변을 합니다.
        </p>
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-2">
        <RequiredLabel required>카테고리</RequiredLabel>
        <Select value={category} onValueChange={setCategory} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "로딩 중..." : "카테고리 선택"} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.code}>
                {cat.name_en} ({cat.name_ko})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 질문 */}
      <div className="space-y-2">
        <RequiredLabel required>질문</RequiredLabel>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="예: What is your hometown like?"
          minHeight="80px"
        />
      </div>

      {/* 목표 밴드 범위 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>목표 Band (최소)</Label>
          <Select value={targetBandMin} onValueChange={setTargetBandMin}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {bandOptions.map((band) => (
                <SelectItem key={band} value={band}>{band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>목표 Band (최대)</Label>
          <Select value={targetBandMax} onValueChange={setTargetBandMax}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {bandOptions.map((band) => (
                <SelectItem key={band} value={band}>{band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 2 에디터
// =============================================================================
function SpeakingPart2EditorEdit({
  topic,
  setTopic,
  points,
  setPoints,
  imageUrl,
  setImageUrl,
  targetBandMin,
  setTargetBandMin,
  targetBandMax,
  setTargetBandMax,
  questionCode,
}: {
  topic: string;
  setTopic: (v: string) => void;
  points: string[];
  setPoints: (v: string[]) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  targetBandMin: string;
  setTargetBandMin: (v: string) => void;
  targetBandMax: string;
  setTargetBandMax: (v: string) => void;
  questionCode?: string;
}) {
  const bandOptions = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

  const updatePoint = (index: number, value: string) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          Part 2: 큐카드를 보고 1분간 준비 후 1~2분간 발표합니다.
        </p>
      </div>

      <div className="border-2 border-slate-300 rounded-lg p-6 bg-white">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">주제</Label>
            <RichTextEditor
              value={topic}
              onChange={setTopic}
              placeholder="예: Describe a book that you have read recently."
              minHeight="60px"
            />
          </div>

          <div className="text-sm text-muted-foreground">You should say:</div>

          <div className="space-y-2 pl-4">
            {points.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <Input
                  value={point}
                  onChange={(e) => updatePoint(index, e.target.value)}
                  placeholder={["what the book was about", "why you decided to read it", "what you liked or disliked", "whether you would recommend it"][index]}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 큐카드 이미지 */}
      <div className="space-y-2">
        <Label>큐카드 이미지 (선택)</Label>
        <FileUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          placeholder="큐카드 이미지 업로드"
          context={questionCode ? `questions/${questionCode}` : undefined}
        />
      </div>

      {/* 목표 밴드 범위 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>목표 Band (최소)</Label>
          <Select value={targetBandMin} onValueChange={setTargetBandMin}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {bandOptions.map((band) => (
                <SelectItem key={band} value={band}>{band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>목표 Band (최대)</Label>
          <Select value={targetBandMax} onValueChange={setTargetBandMax}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {bandOptions.map((band) => (
                <SelectItem key={band} value={band}>{band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 3 에디터
// =============================================================================
function SpeakingPart3EditorEdit({
  question,
  setQuestion,
  relatedPart2Id,
  setRelatedPart2Id,
  part2Questions,
  depthLevel,
  setDepthLevel,
  targetBandMin,
  setTargetBandMin,
  targetBandMax,
  setTargetBandMax,
  isLoading,
}: {
  question: string;
  setQuestion: (v: string) => void;
  relatedPart2Id: string;
  setRelatedPart2Id: (v: string) => void;
  part2Questions: { id: string; question_code: string; topic: string }[];
  depthLevel: 1 | 2 | 3;
  setDepthLevel: (v: 1 | 2 | 3) => void;
  targetBandMin: string;
  setTargetBandMin: (v: string) => void;
  targetBandMax: string;
  setTargetBandMax: (v: string) => void;
  isLoading?: boolean;
}) {
  const bandOptions = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          Part 3: Part 2 주제와 연관된 심화 토론 질문입니다.
        </p>
      </div>

      {/* Part 2 연결 */}
      <div className="space-y-2">
        <RequiredLabel required>연결된 Part 2 질문</RequiredLabel>
        <Select value={relatedPart2Id} onValueChange={setRelatedPart2Id} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "로딩 중..." : "Part 2 질문 선택"} />
          </SelectTrigger>
          <SelectContent>
            {part2Questions.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                [{q.question_code}] {q.topic.slice(0, 50)}{q.topic.length > 50 ? "..." : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {relatedPart2Id && (
          <p className="text-xs text-muted-foreground">
            선택된 Part 2 주제: {part2Questions.find(q => q.id === relatedPart2Id)?.topic}
          </p>
        )}
      </div>

      {/* 심화 레벨 */}
      <div className="space-y-2">
        <Label>심화 레벨</Label>
        <Select value={String(depthLevel)} onValueChange={(v) => setDepthLevel(Number(v) as 1 | 2 | 3)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Level 1 (기본)</SelectItem>
            <SelectItem value="2">Level 2 (중간)</SelectItem>
            <SelectItem value="3">Level 3 (고급)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {depthLevel === 1 && "기본적인 의견이나 경험을 묻는 질문"}
          {depthLevel === 2 && "이유나 비교를 요구하는 질문"}
          {depthLevel === 3 && "추상적인 개념이나 사회적 이슈에 대한 심층 토론"}
        </p>
      </div>

      {/* 질문 */}
      <div className="space-y-2">
        <RequiredLabel required>질문</RequiredLabel>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="예: Do you think reading habits have changed?"
          minHeight="80px"
        />
      </div>

      {/* 목표 밴드 범위 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>목표 Band (최소)</Label>
          <Select value={targetBandMin} onValueChange={setTargetBandMin}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {bandOptions.map((band) => (
                <SelectItem key={band} value={band}>{band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>목표 Band (최대)</Label>
          <Select value={targetBandMax} onValueChange={setTargetBandMax}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {bandOptions.map((band) => (
                <SelectItem key={band} value={band}>{band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 지도 라벨링 에디터
// =============================================================================
interface MapLabelingItem {
  id: string;
  number: number;
  statement: string;
  correctLabel: string;
}

function MapLabelingEditor({
  title,
  setTitle,
  passage,
  setPassage,
  imageUrl,
  setImageUrl,
  labels,
  setLabels,
  items,
  setItems,
  questionCode,
}: {
  title: string;
  setTitle: (v: string) => void;
  passage: string;
  setPassage: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  labels: string[];
  setLabels: (v: string[]) => void;
  items: MapLabelingItem[];
  setItems: (v: MapLabelingItem[]) => void;
  questionCode?: string;
}) {
  // 라벨 개수 변경 시 A~N 자동 생성
  const handleLabelCountChange = (count: number) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newLabels = Array.from({ length: count }, (_, i) => alphabet[i]);
    setLabels(newLabels);
    // 기존 정답이 새 라벨 범위 밖이면 클리어
    setItems(items.map(item =>
      !newLabels.includes(item.correctLabel) ? { ...item, correctLabel: "" } : item
    ));
  };

  const addItem = () => {
    const nextNum = items.length > 0 ? Math.max(...items.map(i => i.number)) + 1 : 1;
    setItems([...items, { id: `ml${Date.now()}`, number: nextNum, statement: "", correctLabel: "" }]);
  };

  const updateItem = (id: string, field: keyof MapLabelingItem, value: unknown) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("최소 1개의 문제 항목이 필요합니다.");
      return;
    }
    const filtered = items.filter(item => item.id !== id);
    // 번호 재정렬
    setItems(filtered.map((item, idx) => ({ ...item, number: idx + 1 })));
  };

  return (
    <div className="space-y-4">
      {/* 제목 + 지문 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <RequiredLabel>제목</RequiredLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: Map of Shopping Centre"
          />
        </div>
        <div className="space-y-2">
          <Label>지문 (선택)</Label>
          <RichTextEditor
            value={passage}
            onChange={setPassage}
            placeholder="지도에 대한 설명 텍스트 (선택사항)"
            minHeight="60px"
          />
        </div>
      </div>

      {/* 이미지 */}
      <div className="space-y-3">
        <RequiredLabel required>지도/이미지</RequiredLabel>
        <p className="text-xs text-muted-foreground">
          A~{labels[labels.length - 1] || "F"} 라벨이 표시된 지도 이미지
        </p>
        <FileUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          placeholder="지도/이미지 업로드"
          context={questionCode ? `questions/${questionCode}` : undefined}
        />
      </div>

      {/* 라벨 설정 + 테이블 */}
      <div className="space-y-3">
        {/* 라벨 개수 설정 */}
        <div className="flex items-center gap-3">
          <Label className="shrink-0">라벨 개수</Label>
          <Select
            value={String(labels.length)}
            onValueChange={(v) => handleLabelCountChange(parseInt(v))}
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

        {/* 문제 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium">건물/장소명</th>
                {labels.map((label) => (
                  <th key={label} className="px-1 py-2 text-center font-medium w-12">{label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground shrink-0 w-5 text-right">{item.number}</span>
                      <Input
                        className="h-8 text-sm min-w-[200px]"
                        value={item.statement}
                        onChange={(e) => updateItem(item.id, "statement", e.target.value)}
                        placeholder="예: Quilt Shop"
                      />
                    </div>
                  </td>
                  {labels.map((label) => (
                    <td key={label} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        className={cn(
                          "w-9 h-9 rounded border-2 flex items-center justify-center transition-colors mx-auto",
                          item.correctLabel === label
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        onClick={() => updateItem(item.id, "correctLabel", item.correctLabel === label ? "" : label)}
                      >
                        {item.correctLabel === label && "✓"}
                      </button>
                    </td>
                  ))}
                  <td className="px-1 py-1.5">
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 행 추가 버튼 */}
        <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          문제 추가
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// 미리보기 다이얼로그
// =============================================================================
function PreviewDialog({
  open,
  onClose,
  questionType,
  previewData,
}: {
  open: boolean;
  onClose: () => void;
  questionType: QuestionType | null;
  previewData: QuestionPreviewData | null;
}) {
  const typeInfo = questionType ? questionTypeInfo.find(t => t.id === questionType) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-w-[95vw] w-[95vw] max-h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            미리보기 - 실제 시험 화면
            {typeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 bg-slate-100 min-h-full">
            {/* Audio */}
            {previewData?.audioUrl && (
              <audio src={previewData.audioUrl} autoPlay />
            )}

            {/* 지시문 */}
            {previewData?.instructions && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">{previewData.instructions}</p>
              </div>
            )}

            {/* Question content */}
            {previewData && <QuestionPreview data={previewData} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
