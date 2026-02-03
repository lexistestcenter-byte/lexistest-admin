"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
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
import { FileUpload } from "@/components/ui/file-upload";

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
  const [fillBlankItems, setFillBlankItems] = useState<string[]>([""]);
  const [fillBlankInputStyle, setFillBlankInputStyle] = useState<"editor" | "items">("items");

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
        const response = await fetch(`/api/questions/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("문제를 찾을 수 없습니다.");
            router.push("/questions");
            return;
          }
          throw new Error("Failed to fetch question");
        }
        const result = await response.json();
        const data = result.question;

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
            // input_style: 하위 호환 - 기존 데이터는 typing=items, drag=editor
            const savedInputStyle = optionsData.input_style || (format === "fill_blank_typing" ? "items" : "editor");
            setFillBlankInputStyle(savedInputStyle);

            // items 데이터 로딩 (typing & drag 공통)
            if (Array.isArray(optionsData.items) && optionsData.items.length > 0) {
              setFillBlankItems(optionsData.items);
            } else if (savedInputStyle === "items" && content) {
              // HTML에서 항목 파싱 (하위 호환)
              const parser = new DOMParser();
              const doc = parser.parseFromString(content, "text/html");
              const elements = doc.querySelectorAll("p, li");
              if (elements.length > 0) {
                const parsed = Array.from(elements).map(el => el.textContent || "").filter(t => t.trim());
                setFillBlankItems(parsed.length > 0 ? parsed : [""]);
              } else {
                const textContent = doc.body.textContent || "";
                const lines = textContent.split("\n").filter(l => l.trim());
                setFillBlankItems(lines.length > 0 ? lines : [""]);
              }
            }

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
        fetch("/api/speaking/categories").then(res => res.json()),
        fetch("/api/speaking/part2-questions").then(res => res.json()),
      ])
        .then(([categoriesData, part2Data]) => {
          setSpeakingCategories(categoriesData.categories || []);
          setPart2Questions(part2Data.questions || []);
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
  const updateWord = (index: number, value: string) => {
    const newBank = [...wordBank];
    newBank[index] = value;
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
      const emptyOptions = matchingOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        toast.error("모든 보기를 입력해주세요.");
        return;
      }
      const emptyItems = matchingItems.filter(i => !i.statement.trim() || !i.correctLabel);
      if (emptyItems.length > 0) {
        toast.error("모든 문항과 정답을 입력해주세요.");
        return;
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
          input_style: fillBlankInputStyle,
          ...(fillBlankInputStyle === "items" ? { items: fillBlankItems } : {}),
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
        content = "";
        optionsData = {
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

      const questionData = {
        question_type: selectedQuestionType,
        question_format: actualFormat,
        content,
        title: contentTitle || flowchartTitle || null,
        instructions: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng") ? (instructions || null) : null,
        options_data: optionsData,
        answer_data: answerData,
        model_answers: modelAnswers,
        generate_followup: generateFollowup,
        is_practice: isPractice,
        tags: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng") && tags ? tags.split(",").map(t => t.trim()) : null,
        // Audio fields (Listening only)
        audio_url: selectedQuestionType === "listening" && audioUrl ? audioUrl : null,
        audio_transcript: selectedQuestionType === "listening" && audioTranscript ? audioTranscript : null,
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

      const response = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details?.join(", ") || "Failed to update question");
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
      const response = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
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

            </div>

            {/* Audio Settings (Listening only) */}
            {selectedQuestionType === "listening" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">오디오 설정</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">오디오 파일 (선택)</Label>
                    <FileUpload
                      value={audioUrl}
                      onChange={setAudioUrl}
                      accept="audio"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">스크립트 (선택)</Label>
                    <Textarea
                      className="text-xs min-h-[80px]"
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="오디오 스크립트를 입력하세요..."
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
                items={fillBlankItems}
                setItems={setFillBlankItems}
                inputStyle={fillBlankInputStyle}
                setInputStyle={setFillBlankInputStyle}
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
                items={fillBlankItems}
                setItems={setFillBlankItems}
                inputStyle={fillBlankInputStyle}
                setInputStyle={setFillBlankInputStyle}
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
                imageUrl={mapLabelingImageUrl}
                setImageUrl={setMapLabelingImageUrl}
                labels={mapLabelingLabels}
                setLabels={setMapLabelingLabels}
                items={mapLabelingItems}
                setItems={setMapLabelingItems}
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
        format={selectedFormat}
        instructions={instructions}
        contentTitle={contentTitle}
        contentHtml={contentHtml}
        blanks={blanks}
        wordBank={wordBank}
        mcqQuestion={mcqQuestion}
        mcqOptions={mcqOptions}
        mcqMaxSelections={mcqMaxSelections}
        mcqIsMultiple={mcqIsMultiple}
        tfngStatement={tfngStatement}
        tfngAnswer={tfngAnswer}
        matchingTitle={matchingTitle}
        matchingOptions={matchingOptions}
        matchingItems={matchingItems}
        matchingAllowDuplicate={matchingAllowDuplicate}
        flowchartTitle={flowchartTitle}
        flowchartNodes={flowchartNodes}
        flowchartBlanks={flowchartBlanks}
        writingTitle={writingTitle}
        writingCondition={writingCondition}
        writingPrompt={writingPrompt}
        writingImageUrl={writingImageUrl}
        writingMinWords={writingMinWords}
        speakingQuestion={speakingQuestion}
        cueCardTopic={cueCardTopic}
        cueCardPoints={cueCardPoints}
        tableInputMode={tableInputMode}
        fillBlankDragAllowDuplicate={fillBlankDragAllowDuplicate}
        fillBlankItems={fillBlankItems}
        fillBlankInputStyle={fillBlankInputStyle}
      />
    </div>
  );
}

// =============================================================================
// 빈칸채우기 에디터 (항목 기반 리스트)
// =============================================================================
function FillBlankEditor({
  title, setTitle, content, setContent, blanks, setBlanks, blankMode, setBlankMode, items, setItems,
  inputStyle, setInputStyle,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  blanks: Blank[]; setBlanks: (v: Blank[]) => void;
  blankMode: "word" | "sentence"; setBlankMode: (v: "word" | "sentence") => void;
  items: string[]; setItems: (v: string[]) => void;
  inputStyle: "editor" | "items"; setInputStyle: (v: "editor" | "items") => void;
}) {
  // --- Items mode state ---
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; text: string; itemIndex: number; selStart: number; selEnd: number } | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // --- Editor mode state ---
  const [editorContextMenu, setEditorContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());

  const blanksRef = useRef(blanks);
  blanksRef.current = blanks;

  // --- Conversion helpers ---
  const convertEditorToItems = (htmlContent: string): string[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const elements = doc.querySelectorAll("p, li");
    if (elements.length > 0) {
      const parsed = Array.from(elements).map(el => el.textContent || "").filter(t => t.trim());
      return parsed.length > 0 ? parsed : [""];
    }
    const text = doc.body.textContent || "";
    const lines = text.split("\n").filter(l => l.trim());
    return lines.length > 0 ? lines : [""];
  };

  const convertItemsToEditor = (itemsList: string[]): string => {
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return itemsList.map(i => `<p>${escapeHtml(i)}</p>`).join("");
  };

  // --- TipTap editor (only used in editor mode) ---
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false })],
    content: inputStyle === "editor" ? content : "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (inputStyle !== "editor") return;
      const html = ed.getHTML();
      setContent(html);
      const text = ed.state.doc.textContent;
      const foundNums: number[] = [];
      const re = /\[(\d+)\]/g;
      let match;
      while ((match = re.exec(text)) !== null) foundNums.push(parseInt(match[1]));
      const seen = new Set<number>();
      const duplicates = new Set<number>();
      for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
      if (duplicates.size > 0) {
        toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]. 같은 번호를 여러 번 사용할 수 없습니다.`);
      }
      const uniqueNums = [...new Set(foundNums)];
      const curr = blanksRef.current;
      let updated = [...curr];
      let changed = false;
      for (const num of uniqueNums) {
        if (!updated.some(b => b.number === num)) {
          const answer = pendingAnswers.current.get(num) || "";
          pendingAnswers.current.delete(num);
          updated.push({ id: `b${Date.now()}-${num}`, number: num, answer, alternatives: [] });
          changed = true;
        }
      }
      const before = updated.length;
      updated = updated.filter(b => uniqueNums.includes(b.number));
      if (updated.length !== before) changed = true;
      updated.sort((a, b) => a.number - b.number);
      if (changed) setBlanks(updated);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2 [&_p]:my-1 [&_strong]:font-bold",
      },
    },
  });

  useEffect(() => {
    if (inputStyle === "editor" && editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, inputStyle]);

  // --- Items mode: items → content sync ---
  const syncFromItems = useCallback((newItems: string[]) => {
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = newItems.map(i => `<p>${escapeHtml(i)}</p>`).join("");
    setContent(html);

    const allText = newItems.join("\n");
    const foundNums: number[] = [];
    const re = /\[(\d+)\]/g;
    let match;
    while ((match = re.exec(allText)) !== null) foundNums.push(parseInt(match[1]));

    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
    if (duplicates.size > 0) {
      toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]. 같은 번호를 여러 번 사용할 수 없습니다.`);
    }

    const uniqueNums = [...new Set(foundNums)];
    const curr = blanksRef.current;
    let updated = [...curr];
    let changed = false;
    for (const num of uniqueNums) {
      if (!updated.some(b => b.number === num)) {
        updated.push({ id: `b${Date.now()}-${num}`, number: num, answer: "", alternatives: [] });
        changed = true;
      }
    }
    const before = updated.length;
    updated = updated.filter(b => uniqueNums.includes(b.number));
    if (updated.length !== before) changed = true;
    updated.sort((a, b) => a.number - b.number);
    if (changed) setBlanks(updated);
  }, [setContent, setBlanks]);

  // --- Items mode handlers ---
  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    syncFromItems(newItems);
  };

  const addItem = () => {
    const newItems = [...items, ""];
    setItems(newItems);
    syncFromItems(newItems);
    setTimeout(() => {
      const ref = textareaRefs.current[newItems.length - 1];
      if (ref) ref.focus();
    }, 0);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    syncFromItems(newItems);
  };

  const handleItemContextMenu = (e: React.MouseEvent, itemIndex: number) => {
    const textarea = textareaRefs.current[itemIndex];
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) return;
    const selectedText = items[itemIndex].substring(selectionStart, selectionEnd).trim();
    if (!selectedText) return;
    if (blankMode === "word") {
      if (/\s/.test(selectedText)) {
        e.preventDefault();
        toast.warning("공백이 포함된 단어는 빈칸으로 만들 수 없습니다. 단어 하나만 선택해주세요.");
        return;
      }
    } else {
      if (/^\s/.test(items[itemIndex].substring(selectionStart, selectionEnd))) {
        e.preventDefault();
        toast.warning("첫 글자가 공백인 텍스트는 빈칸으로 만들 수 없습니다.");
        return;
      }
    }
    e.preventDefault();
    setItemContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, itemIndex, selStart: selectionStart, selEnd: selectionEnd });
  };

  const createBlankFromItemSelection = () => {
    if (!itemContextMenu) return;
    const { text, itemIndex, selStart, selEnd } = itemContextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const itemText = items[itemIndex];
    const newText = itemText.substring(0, selStart) + `[${nextNum}]` + itemText.substring(selEnd);
    const newItems = [...items];
    newItems[itemIndex] = newText;
    setItems(newItems);
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    setContent(newItems.map(i => `<p>${escapeHtml(i)}</p>`).join(""));
    const newBlanks = [...blanks, { id: `b${Date.now()}-${nextNum}`, number: nextNum, answer: text, alternatives: [] as string[] }];
    newBlanks.sort((a, b) => a.number - b.number);
    setBlanks(newBlanks);
    setItemContextMenu(null);
  };

  // --- Editor mode handlers ---
  const handleEditorContextMenu = (e: React.MouseEvent) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) return;
    if (blankMode === "word") {
      if (/\s/.test(selectedText)) {
        e.preventDefault();
        toast.warning("공백이 포함된 단어는 빈칸으로 만들 수 없습니다. 단어 하나만 선택해주세요.");
        return;
      }
    } else {
      if (/^\s/.test(editor.state.doc.textBetween(from, to))) {
        e.preventDefault();
        toast.warning("첫 글자가 공백인 텍스트는 빈칸으로 만들 수 없습니다.");
        return;
      }
    }
    e.preventDefault();
    setEditorContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromEditorSelection = () => {
    if (!editorContextMenu || !editor) return;
    const { text, from, to } = editorContextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
    setEditorContextMenu(null);
  };

  // --- Common handlers ---
  const removeBlankAndRestore = (id: string) => {
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;
    const marker = `[${blank.number}]`;
    if (inputStyle === "items") {
      const newItems = items.map(item => item.replace(marker, blank.answer || ""));
      setItems(newItems);
      syncFromItems(newItems);
    } else if (editor) {
      const html = editor.getHTML();
      const newHtml = html.replace(`[${blank.number}]`, blank.answer || "");
      editor.commands.setContent(newHtml);
    }
  };

  const updateBlankAnswer = (id: string, newAnswer: string) => {
    const clean = blankMode === "word" ? newAnswer.replace(/\s/g, "") : newAnswer.replace(/^\s+/, "");
    setBlanks(blanks.map(b => b.id === id ? { ...b, answer: clean } : b));
  };

  // --- Mode switch handler ---
  const handleInputStyleChange = (newStyle: "editor" | "items") => {
    if (newStyle === inputStyle) return;
    if (newStyle === "items") {
      const newItems = convertEditorToItems(content);
      setItems(newItems);
      if (content.includes("<strong>") || content.includes("<em>")) {
        toast.info("에디터의 서식(굵게, 기울임 등)이 제거되었습니다.");
      }
    } else {
      const html = convertItemsToEditor(items);
      setContent(html);
      if (editor) {
        editor.commands.setContent(html);
      }
    }
    setInputStyle(newStyle);
  };

  return (
    <div className="space-y-6" onClick={() => { setItemContextMenu(null); setEditorContextMenu(null); }}>
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="지문 제목" />
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className={`text-sm font-medium ${blankMode === "word" ? "text-primary" : "text-muted-foreground"}`}>워드형</span>
        <Switch
          checked={blankMode === "sentence"}
          onCheckedChange={(checked) => {
            const newMode = checked ? "sentence" : "word";
            const hasContent = inputStyle === "items" ? items.some(i => i.trim()) : content.trim();
            if (hasContent || blanks.length > 0) {
              if (inputStyle === "items") { setItems([""]); }
              setContent("");
              setBlanks([]);
              if (editor) editor.commands.setContent("");
              toast.info("모드가 변경되어 내용이 초기화되었습니다");
            }
            setBlankMode(newMode);
          }}
        />
        <span className={`text-sm font-medium ${blankMode === "sentence" ? "text-primary" : "text-muted-foreground"}`}>문장형</span>
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className={`text-sm font-medium ${inputStyle === "editor" ? "text-primary" : "text-muted-foreground"}`}>에디터</span>
        <Switch
          checked={inputStyle === "items"}
          onCheckedChange={(checked) => handleInputStyleChange(checked ? "items" : "editor")}
        />
        <span className={`text-sm font-medium ${inputStyle === "items" ? "text-primary" : "text-muted-foreground"}`}>항목</span>
      </div>

      {inputStyle === "items" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>항목 목록 ({items.length}개) *</Label>
            <p className="text-xs text-muted-foreground">
              텍스트 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
            </p>
          </div>
          <div className="relative">
            <div className="border rounded-lg divide-y">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 px-3 py-2">
                  <span className="mt-2 text-xs text-muted-foreground font-mono w-6 text-right shrink-0">{index + 1}</span>
                  <Textarea
                    ref={(el) => { textareaRefs.current[index] = el; }}
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    onContextMenu={(e) => handleItemContextMenu(e, index)}
                    placeholder={`항목 ${index + 1} 텍스트 입력...`}
                    className="flex-1 min-h-[40px] text-sm resize-none"
                    rows={1}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 mt-0.5"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> 항목 추가
            </Button>
            {itemContextMenu && (
              <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
                style={{ left: itemContextMenu.x, top: itemContextMenu.y }}
                onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  onClick={createBlankFromItemSelection}>
                  <Plus className="h-4 w-4" />
                  빈칸 만들기: &ldquo;{itemContextMenu.text.length > 20 ? itemContextMenu.text.slice(0, 20) + "…" : itemContextMenu.text}&rdquo;
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>지문 *</Label>
          <p className="text-xs text-muted-foreground">
            단어를 드래그로 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
          </p>
          <div className="relative">
            <div className="border rounded-md overflow-hidden" onContextMenu={handleEditorContextMenu}>
              <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("bold") ? "bg-slate-200" : ""}`}
                ><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("italic") ? "bg-slate-200" : ""}`}
                ><Italic className="h-4 w-4" /></Button>
              </div>
              <EditorContent editor={editor} className="bg-white" />
            </div>
            {editorContextMenu && (
              <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
                style={{ left: editorContextMenu.x, top: editorContextMenu.y }}
                onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  onClick={createBlankFromEditorSelection}>
                  <Plus className="h-4 w-4" />
                  빈칸 만들기: &ldquo;{editorContextMenu.text.length > 20 ? editorContextMenu.text.slice(0, 20) + "…" : editorContextMenu.text}&rdquo;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {blanks.length > 0 && (
        <div className="space-y-3">
          <Label>빈칸 정답 ({blanks.length}개)</Label>
          <div className="border rounded-lg divide-y">
            {blanks.map((blank) => (
              <div key={blank.id} className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{blank.number}</span>
                  <Input className="flex-1 h-8 text-sm" value={blank.answer}
                    onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                    placeholder={blankMode === "word" ? "정답 단어 입력" : "정답 (문장 가능)"} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeBlankAndRestore(blank.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 빈칸채우기 드래그앤드랍 에디터 (TipTap + 우클릭 빈칸 생성)
// =============================================================================
function FillBlankDragEditor({
  title, setTitle, content, setContent, blanks, setBlanks, wordBank, setWordBank, blankMode, setBlankMode, allowDuplicate, setAllowDuplicate,
  items, setItems, inputStyle, setInputStyle,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  blanks: Blank[]; setBlanks: (v: Blank[]) => void;
  wordBank: string[]; setWordBank: (v: string[]) => void;
  blankMode: "word" | "sentence"; setBlankMode: (v: "word" | "sentence") => void;
  allowDuplicate: boolean; setAllowDuplicate: (v: boolean) => void;
  items: string[]; setItems: (v: string[]) => void;
  inputStyle: "editor" | "items"; setInputStyle: (v: "editor" | "items") => void;
}) {
  // --- Editor mode state ---
  const [editorContextMenu, setEditorContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());

  // --- Items mode state ---
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number; y: number; text: string; itemIndex: number; selStart: number; selEnd: number } | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const blanksRef = useRef(blanks);
  const wordBankRef = useRef(wordBank);
  blanksRef.current = blanks;
  wordBankRef.current = wordBank;

  // --- Conversion helpers ---
  const convertEditorToItems = (htmlContent: string): string[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const elements = doc.querySelectorAll("p, li");
    if (elements.length > 0) {
      const parsed = Array.from(elements).map(el => el.textContent || "").filter(t => t.trim());
      return parsed.length > 0 ? parsed : [""];
    }
    const text = doc.body.textContent || "";
    const lines = text.split("\n").filter(l => l.trim());
    return lines.length > 0 ? lines : [""];
  };

  const convertItemsToEditor = (itemsList: string[]): string => {
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return itemsList.map(i => `<p>${escapeHtml(i)}</p>`).join("");
  };

  // --- TipTap editor ---
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false })],
    content: inputStyle === "editor" ? content : "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (inputStyle !== "editor") return;
      const html = ed.getHTML();
      setContent(html);
      const text = ed.state.doc.textContent;
      const foundNums: number[] = [];
      const re = /\[(\d+)\]/g;
      let match;
      while ((match = re.exec(text)) !== null) foundNums.push(parseInt(match[1]));
      const seen = new Set<number>();
      const duplicates = new Set<number>();
      for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
      if (duplicates.size > 0) {
        toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]. 같은 번호를 여러 번 사용할 수 없습니다.`);
      }
      const uniqueNums = [...new Set(foundNums)];
      const curr = blanksRef.current;
      let updated = [...curr];
      let changed = false;
      for (const num of uniqueNums) {
        if (!updated.some(b => b.number === num)) {
          const answer = pendingAnswers.current.get(num) || "";
          pendingAnswers.current.delete(num);
          updated.push({ id: `b${Date.now()}-${num}`, number: num, answer, alternatives: [] });
          changed = true;
        }
      }
      const before = updated.length;
      const removed = updated.filter(b => !uniqueNums.includes(b.number));
      updated = updated.filter(b => uniqueNums.includes(b.number));
      if (updated.length !== before) {
        changed = true;
        const remainingAnswers = new Set(updated.map(b => b.answer).filter(Boolean));
        const toRemove = removed.map(b => b.answer).filter(a => a && !remainingAnswers.has(a));
        if (toRemove.length > 0) setWordBank(wordBankRef.current.filter(w => !toRemove.includes(w)));
      }
      updated.sort((a, b) => a.number - b.number);
      if (changed) setBlanks(updated);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2 [&_p]:my-1 [&_strong]:font-bold",
      },
    },
  });

  useEffect(() => {
    if (inputStyle === "editor" && editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, inputStyle]);

  // --- Items mode: items → content sync ---
  const syncFromItems = useCallback((newItems: string[]) => {
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = newItems.map(i => `<p>${escapeHtml(i)}</p>`).join("");
    setContent(html);

    const allText = newItems.join("\n");
    const foundNums: number[] = [];
    const re = /\[(\d+)\]/g;
    let match;
    while ((match = re.exec(allText)) !== null) foundNums.push(parseInt(match[1]));

    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
    if (duplicates.size > 0) {
      toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]. 같은 번호를 여러 번 사용할 수 없습니다.`);
    }

    const uniqueNums = [...new Set(foundNums)];
    const curr = blanksRef.current;
    let updated = [...curr];
    let changed = false;
    for (const num of uniqueNums) {
      if (!updated.some(b => b.number === num)) {
        updated.push({ id: `b${Date.now()}-${num}`, number: num, answer: "", alternatives: [] });
        changed = true;
      }
    }
    const before = updated.length;
    const removed = updated.filter(b => !uniqueNums.includes(b.number));
    updated = updated.filter(b => uniqueNums.includes(b.number));
    if (updated.length !== before) {
      changed = true;
      const remainingAnswers = new Set(updated.map(b => b.answer).filter(Boolean));
      const toRemove = removed.map(b => b.answer).filter(a => a && !remainingAnswers.has(a));
      if (toRemove.length > 0) setWordBank(wordBankRef.current.filter(w => !toRemove.includes(w)));
    }
    updated.sort((a, b) => a.number - b.number);
    if (changed) setBlanks(updated);
  }, [setContent, setBlanks, setWordBank]);

  // --- Items mode handlers ---
  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    syncFromItems(newItems);
  };

  const addItem = () => {
    const newItems = [...items, ""];
    setItems(newItems);
    syncFromItems(newItems);
    setTimeout(() => {
      const ref = textareaRefs.current[newItems.length - 1];
      if (ref) ref.focus();
    }, 0);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    syncFromItems(newItems);
  };

  const handleItemContextMenu = (e: React.MouseEvent, itemIndex: number) => {
    const textarea = textareaRefs.current[itemIndex];
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) return;
    const selectedText = items[itemIndex].substring(selectionStart, selectionEnd).trim();
    if (!selectedText) return;
    if (blankMode === "word") {
      if (/\s/.test(selectedText)) {
        e.preventDefault();
        toast.warning("공백이 포함된 단어는 빈칸으로 만들 수 없습니다. 단어 하나만 선택해주세요.");
        return;
      }
    } else {
      if (/^\s/.test(items[itemIndex].substring(selectionStart, selectionEnd))) {
        e.preventDefault();
        toast.warning("첫 글자가 공백인 텍스트는 빈칸으로 만들 수 없습니다.");
        return;
      }
    }
    e.preventDefault();
    setItemContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, itemIndex, selStart: selectionStart, selEnd: selectionEnd });
  };

  const createBlankFromItemSelection = () => {
    if (!itemContextMenu) return;
    const { text, itemIndex, selStart, selEnd } = itemContextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const itemText = items[itemIndex];
    const newText = itemText.substring(0, selStart) + `[${nextNum}]` + itemText.substring(selEnd);
    const newItems = [...items];
    newItems[itemIndex] = newText;
    setItems(newItems);
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    setContent(newItems.map(i => `<p>${escapeHtml(i)}</p>`).join(""));
    const newBlanks = [...blanks, { id: `b${Date.now()}-${nextNum}`, number: nextNum, answer: text, alternatives: [] as string[] }];
    newBlanks.sort((a, b) => a.number - b.number);
    setBlanks(newBlanks);
    if (!wordBank.includes(text)) setWordBank([...wordBank, text]);
    setItemContextMenu(null);
  };

  // --- Editor mode handlers ---
  const handleEditorContextMenu = (e: React.MouseEvent) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) return;
    if (blankMode === "word") {
      if (/\s/.test(selectedText)) {
        e.preventDefault();
        toast.warning("공백이 포함된 단어는 빈칸으로 만들 수 없습니다. 단어 하나만 선택해주세요.");
        return;
      }
    } else {
      if (/^\s/.test(editor.state.doc.textBetween(from, to))) {
        e.preventDefault();
        toast.warning("첫 글자가 공백인 텍스트는 빈칸으로 만들 수 없습니다.");
        return;
      }
    }
    e.preventDefault();
    setEditorContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromEditorSelection = () => {
    if (!editorContextMenu || !editor) return;
    const { text, from, to } = editorContextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
    if (!wordBank.includes(text)) setWordBank([...wordBank, text]);
    setEditorContextMenu(null);
  };

  // --- Common handlers ---
  const removeBlankAndRestore = (id: string) => {
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;
    const marker = `[${blank.number}]`;
    if (inputStyle === "items") {
      const newItems = items.map(item => item.replace(marker, blank.answer || ""));
      setItems(newItems);
      syncFromItems(newItems);
    } else if (editor) {
      const html = editor.getHTML();
      const newHtml = html.replace(`[${blank.number}]`, blank.answer || "");
      editor.commands.setContent(newHtml);
    }
  };

  const updateBlankAnswer = (id: string, newAnswer: string) => {
    const clean = blankMode === "word" ? newAnswer.replace(/\s/g, "") : newAnswer.replace(/^\s+/, "");
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;
    const oldAnswer = blank.answer;
    setBlanks(blanks.map(b => b.id === id ? { ...b, answer: clean } : b));
    if (oldAnswer && oldAnswer !== clean) {
      const stillUsed = blanks.some(b => b.id !== id && b.answer === oldAnswer);
      let wb = [...wordBankRef.current];
      if (!stillUsed) wb = wb.filter(w => w !== oldAnswer);
      if (clean && !wb.includes(clean)) wb.push(clean);
      setWordBank(wb);
    } else if (clean && !wordBankRef.current.includes(clean)) {
      setWordBank([...wordBankRef.current, clean]);
    }
  };

  // --- Mode switch handler ---
  const handleInputStyleChange = (newStyle: "editor" | "items") => {
    if (newStyle === inputStyle) return;
    if (newStyle === "items") {
      const newItems = convertEditorToItems(content);
      setItems(newItems);
      if (content.includes("<strong>") || content.includes("<em>")) {
        toast.info("에디터의 서식(굵게, 기울임 등)이 제거되었습니다.");
      }
    } else {
      const html = convertItemsToEditor(items);
      setContent(html);
      if (editor) {
        editor.commands.setContent(html);
      }
    }
    setInputStyle(newStyle);
  };

  return (
    <div className="space-y-6" onClick={() => { setEditorContextMenu(null); setItemContextMenu(null); }}>
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="지문 제목" />
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className={`text-sm font-medium ${blankMode === "word" ? "text-primary" : "text-muted-foreground"}`}>워드형</span>
        <Switch
          checked={blankMode === "sentence"}
          onCheckedChange={(checked) => {
            const newMode = checked ? "sentence" : "word";
            const hasContent = inputStyle === "items" ? items.some(i => i.trim()) : content.trim();
            if (hasContent || blanks.length > 0) {
              if (inputStyle === "items") { setItems([""]); }
              setContent("");
              setBlanks([]);
              setWordBank([]);
              if (editor) editor.commands.setContent("");
              toast.info("모드가 변경되어 내용이 초기화되었습니다");
            }
            setBlankMode(newMode);
          }}
        />
        <span className={`text-sm font-medium ${blankMode === "sentence" ? "text-primary" : "text-muted-foreground"}`}>문장형</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">중복 단어 허용</span>
          <Switch checked={allowDuplicate} onCheckedChange={setAllowDuplicate} />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className={`text-sm font-medium ${inputStyle === "editor" ? "text-primary" : "text-muted-foreground"}`}>에디터</span>
        <Switch
          checked={inputStyle === "items"}
          onCheckedChange={(checked) => handleInputStyleChange(checked ? "items" : "editor")}
        />
        <span className={`text-sm font-medium ${inputStyle === "items" ? "text-primary" : "text-muted-foreground"}`}>항목</span>
      </div>

      {inputStyle === "items" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>항목 목록 ({items.length}개) *</Label>
            <p className="text-xs text-muted-foreground">
              텍스트 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
            </p>
          </div>
          <div className="relative">
            <div className="border rounded-lg divide-y">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 px-3 py-2">
                  <span className="mt-2 text-xs text-muted-foreground font-mono w-6 text-right shrink-0">{index + 1}</span>
                  <Textarea
                    ref={(el) => { textareaRefs.current[index] = el; }}
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    onContextMenu={(e) => handleItemContextMenu(e, index)}
                    placeholder={`항목 ${index + 1} 텍스트 입력...`}
                    className="flex-1 min-h-[40px] text-sm resize-none"
                    rows={1}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 mt-0.5"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> 항목 추가
            </Button>
            {itemContextMenu && (
              <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
                style={{ left: itemContextMenu.x, top: itemContextMenu.y }}
                onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  onClick={createBlankFromItemSelection}>
                  <Plus className="h-4 w-4" />
                  빈칸 만들기: &ldquo;{itemContextMenu.text.length > 20 ? itemContextMenu.text.slice(0, 20) + "…" : itemContextMenu.text}&rdquo;
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <RequiredLabel required>내용</RequiredLabel>
            <p className="text-xs text-muted-foreground">
              단어를 드래그 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / <code className="bg-slate-100 px-1 rounded">[번호]</code> 직접 입력 가능
            </p>
          </div>
          <div className="relative">
            <div className="border rounded-md overflow-hidden" onContextMenu={handleEditorContextMenu}>
              <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("bold") ? "bg-slate-200" : ""}`}
                ><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("italic") ? "bg-slate-200" : ""}`}
                ><Italic className="h-4 w-4" /></Button>
              </div>
              <EditorContent editor={editor} className="bg-white" />
            </div>
            {editorContextMenu && (
              <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
                style={{ left: editorContextMenu.x, top: editorContextMenu.y }}
                onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  onClick={createBlankFromEditorSelection}>
                  <Plus className="h-4 w-4" />
                  빈칸 만들기: &ldquo;{editorContextMenu.text.length > 20 ? editorContextMenu.text.slice(0, 20) + "…" : editorContextMenu.text}&rdquo;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {blanks.length > 0 && (
        <div className="space-y-3">
          <RequiredLabel required>빈칸 목록 ({blanks.length}개)</RequiredLabel>
          <div className="border rounded-lg divide-y">
            {blanks.map((blank) => (
              <div key={blank.id} className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{blank.number}</span>
                  <Input className="flex-1 h-8 text-sm" value={blank.answer}
                    onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                    placeholder="정답 단어 입력" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeBlankAndRestore(blank.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wordBank.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Word Bank 미리보기</Label>
            <span className="text-[10px] text-muted-foreground">(드래그하여 순서 변경)</span>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-dashed">
            {wordBank.map((word, i) => {
              const isAnswer = blanks.some(b => b.answer === word);
              return (
                <span key={`${i}-${word}`} draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  onDrop={() => {
                    if (dragIdx === null || dragIdx === i) return;
                    const r = [...wordBank]; const [mv] = r.splice(dragIdx, 1); r.splice(i, 0, mv);
                    setWordBank(r); setDragIdx(null); setDragOverIdx(null);
                  }}
                  className={`px-3 py-1 rounded-md text-sm border cursor-grab active:cursor-grabbing select-none transition-all ${dragIdx === i ? "opacity-40 scale-95" : ""} ${dragOverIdx === i && dragIdx !== i ? "ring-2 ring-primary ring-offset-1" : ""} ${isAnswer ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: Which TWO of the following statements are true?"
          rows={3}
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
        <Textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="예: The number of students increased significantly in 2020."
          rows={3}
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
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false })],
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
          <Label>지문 내용 *</Label>
          <p className="text-xs text-muted-foreground">
            섹션 시작 위치에서 <strong>우클릭</strong> → 섹션 마커 삽입 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
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
            <Label>제목 목록 (List of Headings) *</Label>
            <p className="text-xs text-muted-foreground mt-0.5">정답 제목과 오답(함정) 제목을 모두 추가하세요.</p>
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
// 테이블 완성하기 에디터
// =============================================================================
function TableCompletionEditor({
  title, setTitle, content, setContent, blanks, setBlanks, wordBank, setWordBank, blankMode, setBlankMode, inputMode, setInputMode,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  blanks: Blank[]; setBlanks: (v: Blank[]) => void;
  wordBank: string[]; setWordBank: (v: string[]) => void;
  blankMode: "word" | "sentence"; setBlankMode: (v: "word" | "sentence") => void;
  inputMode: "typing" | "drag"; setInputMode: (v: "typing" | "drag") => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());
  const blanksRef = useRef(blanks);
  const wordBankRef = useRef(wordBank);
  blanksRef.current = blanks;
  wordBankRef.current = wordBank;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      const text = editor.state.doc.textContent;
      const foundNums: number[] = [];
      const re = /\[(\d+)\]/g;
      let match;
      while ((match = re.exec(text)) !== null) foundNums.push(parseInt(match[1]));
      const seen = new Set<number>();
      const duplicates = new Set<number>();
      for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
      if (duplicates.size > 0) {
        toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]`);
      }
      const uniqueNums = [...new Set(foundNums)];
      const curr = blanksRef.current;
      let updated = [...curr];
      let changed = false;
      for (const num of uniqueNums) {
        if (!updated.some(b => b.number === num)) {
          const answer = pendingAnswers.current.get(num) || "";
          pendingAnswers.current.delete(num);
          updated.push({ id: `b${Date.now()}-${num}`, number: num, answer, alternatives: [] });
          changed = true;
        }
      }
      const before = updated.length;
      const removed = updated.filter(b => !uniqueNums.includes(b.number));
      updated = updated.filter(b => uniqueNums.includes(b.number));
      if (updated.length !== before) {
        changed = true;
        if (inputMode === "drag") {
          const remainingAnswers = new Set(updated.map(b => b.answer).filter(Boolean));
          const toRemove = removed.map(b => b.answer).filter(a => a && !remainingAnswers.has(a));
          if (toRemove.length > 0) setWordBank(wordBankRef.current.filter(w => !toRemove.includes(w)));
        }
      }
      updated.sort((a, b) => a.number - b.number);
      if (changed) setBlanks(updated);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2 [&_p]:my-1 [&_strong]:font-bold [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold",
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
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) return;
    if (blankMode === "word") {
      if (/\s/.test(selectedText)) {
        e.preventDefault();
        toast.warning("공백이 포함된 단어는 빈칸으로 만들 수 없습니다.");
        return;
      }
    } else {
      if (/^\s/.test(editor.state.doc.textBetween(from, to))) {
        e.preventDefault();
        toast.warning("첫 글자가 공백인 텍스트는 빈칸으로 만들 수 없습니다.");
        return;
      }
    }
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromSelection = () => {
    if (!contextMenu || !editor) return;
    const { text, from, to } = contextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
    if (inputMode === "drag" && !wordBank.includes(text)) setWordBank([...wordBank, text]);
    setContextMenu(null);
  };

  const removeBlankAndRestore = (id: string) => {
    const blank = blanks.find(b => b.id === id);
    if (!blank || !editor) return;
    const html = editor.getHTML();
    const newHtml = html.replace(`[${blank.number}]`, blank.answer || "");
    editor.commands.setContent(newHtml);
  };

  const updateBlankAnswer = (id: string, newAnswer: string) => {
    const clean = blankMode === "word" ? newAnswer.replace(/\s/g, "") : newAnswer.replace(/^\s+/, "");
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;
    const oldAnswer = blank.answer;
    setBlanks(blanks.map(b => b.id === id ? { ...b, answer: clean } : b));
    if (inputMode === "drag") {
      if (oldAnswer && oldAnswer !== clean) {
        const stillUsed = blanks.some(b => b.id !== id && b.answer === oldAnswer);
        let wb = [...wordBankRef.current];
        if (!stillUsed) wb = wb.filter(w => w !== oldAnswer);
        if (clean && !wb.includes(clean)) wb.push(clean);
        setWordBank(wb);
      } else if (clean && !wordBankRef.current.includes(clean)) {
        setWordBank([...wordBankRef.current, clean]);
      }
    }
  };

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="테이블 제목" />
      </div>

      {/* 입력 모드 */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className="text-sm font-medium">입력 방식:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputMode("typing")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === "typing" ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
              }`}
          >
            직접입력
          </button>
          <button
            onClick={() => setInputMode("drag")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === "drag" ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
              }`}
          >
            드래그앤드랍
          </button>
        </div>
      </div>

      {/* 빈칸 모드 */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className={`text-sm font-medium ${blankMode === "word" ? "text-primary" : "text-muted-foreground"}`}>워드형</span>
        <Switch
          checked={blankMode === "sentence"}
          onCheckedChange={(checked) => {
            const newMode = checked ? "sentence" : "word";
            if (content.trim() || blanks.length > 0) {
              setContent("");
              setBlanks([]);
              if (inputMode === "drag") setWordBank([]);
              toast.info("모드가 변경되어 내용이 초기화되었습니다");
            }
            setBlankMode(newMode);
          }}
        />
        <span className={`text-sm font-medium ${blankMode === "sentence" ? "text-primary" : "text-muted-foreground"}`}>문장형</span>
      </div>

      {/* 에디터 */}
      <div className="space-y-2">
        <Label>테이블 지문 *</Label>
        <p className="text-xs text-muted-foreground">
          텍스트를 드래그로 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
        </p>
        <div className="relative">
          <div className="border rounded-md overflow-hidden" onContextMenu={handleContextMenu}>
            <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50 flex-wrap">
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`h-8 w-8 p-0 ${editor?.isActive("bold") ? "bg-slate-200" : ""}`}
              ><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`h-8 w-8 p-0 ${editor?.isActive("italic") ? "bg-slate-200" : ""}`}
              ><Italic className="h-4 w-4" /></Button>
              <div className="w-px h-6 bg-slate-300 mx-1" />
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="h-8 px-2 text-xs"
              >테이블 삽입</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                disabled={!editor?.can().addColumnAfter()}
                className="h-8 px-2 text-xs"
              >열 추가</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().deleteColumn().run()}
                disabled={!editor?.can().deleteColumn()}
                className="h-8 px-2 text-xs"
              >열 삭제</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                disabled={!editor?.can().addRowAfter()}
                className="h-8 px-2 text-xs"
              >행 추가</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().deleteRow().run()}
                disabled={!editor?.can().deleteRow()}
                className="h-8 px-2 text-xs"
              >행 삭제</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().mergeCells().run()}
                disabled={!editor?.can().mergeCells()}
                className="h-8 px-2 text-xs"
              >셀 병합</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().splitCell().run()}
                disabled={!editor?.can().splitCell()}
                className="h-8 px-2 text-xs"
              >셀 분할</Button>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
                disabled={!editor?.can().toggleHeaderRow()}
                className="h-8 px-2 text-xs"
              >헤더행</Button>
            </div>
            <EditorContent editor={editor} className="bg-white" />
          </div>
          {contextMenu && (
            <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                onClick={createBlankFromSelection}>
                <Plus className="h-4 w-4" />
                빈칸 만들기: &ldquo;{contextMenu.text.length > 20 ? contextMenu.text.slice(0, 20) + "…" : contextMenu.text}&rdquo;
              </button>
            </div>
          )}
        </div>
      </div>

      {blanks.length > 0 && (
        <div className="space-y-3">
          <Label>빈칸 목록 ({blanks.length}개)</Label>
          <div className="border rounded-lg divide-y">
            {blanks.map((blank) => (
              <div key={blank.id} className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{blank.number}</span>
                  <Input className="flex-1 h-8 text-sm" value={blank.answer}
                    onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                    placeholder={blankMode === "word" ? "정답 단어 입력" : "정답 (문장 가능)"} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeBlankAndRestore(blank.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: What is your hometown like?"
          rows={3}
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
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: Describe a book that you have read recently."
              rows={2}
              className="text-lg font-medium"
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
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: Do you think reading habits have changed?"
          rows={3}
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
  imageUrl,
  setImageUrl,
  labels,
  setLabels,
  items,
  setItems,
}: {
  imageUrl: string;
  setImageUrl: (v: string) => void;
  labels: string[];
  setLabels: (v: string[]) => void;
  items: MapLabelingItem[];
  setItems: (v: MapLabelingItem[]) => void;
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
    <div className="grid grid-cols-2 gap-4">
      {/* 왼쪽: 이미지 */}
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
        />
      </div>

      {/* 오른쪽: 라벨 설정 + 테이블 */}
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
                <th className="px-2 py-2 text-left font-medium w-8">#</th>
                <th className="px-2 py-2 text-left font-medium">건물/장소명</th>
                {labels.map((label) => (
                  <th key={label} className="px-1 py-2 text-center font-medium w-8">{label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-1.5 font-bold text-muted-foreground">{item.number}</td>
                  <td className="px-1 py-1">
                    <Input
                      className="h-8 text-sm"
                      value={item.statement}
                      onChange={(e) => updateItem(item.id, "statement", e.target.value)}
                      placeholder="예: Quilt Shop"
                    />
                  </td>
                  {labels.map((label) => (
                    <td key={label} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mx-auto",
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
// 빈칸채우기 (드래그앤드랍) 미리보기 컴포넌트
// =============================================================================
function FillBlankDragPreview({
  title, content, blanks, wordBank, allowDuplicate = false, items = [], inputStyle = "editor",
}: {
  title: string; content: string; blanks: Blank[]; wordBank: string[]; allowDuplicate?: boolean;
  items?: string[]; inputStyle?: "editor" | "items";
}) {
  const [placedWords, setPlacedWords] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const availableWords = allowDuplicate
    ? wordBank.filter(w => w)
    : wordBank.filter(w => w && !Object.values(placedWords).includes(w));

  const handleDrop = (num: number) => {
    if (draggedWord) {
      setPlacedWords(prev => ({ ...prev, [num]: draggedWord }));
      setDraggedWord(null);
    }
  };

  const renderItemContent = (text: string) => {
    const parts = text.split(/\[(\d+)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const num = parseInt(part);
        const placed = placedWords[num];
        return (
          <span key={index} className="inline-flex items-center mx-0.5 align-middle">
            <span
              className={`inline-flex items-center justify-center min-w-[120px] h-8 border-2 rounded px-2 text-sm transition-colors ${placed ? "bg-green-50 border-green-400 text-green-800 cursor-pointer" : draggedWord ? "border-dashed border-primary bg-primary/5" : "border-slate-300 bg-white text-slate-400"}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(num)}
              onDoubleClick={() => placed && setPlacedWords(prev => { const n = { ...prev }; delete n[num]; return n; })}
              title={placed ? "더블클릭하여 제거" : ""}
            >
              {placed || num}
            </span>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderContent = () => {
    if (!content) return null;
    const parts = content.split(/\[(\d+)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const num = parseInt(part);
        const placed = placedWords[num];
        return (
          <span key={index} className="inline-flex items-center mx-0.5 align-middle">
            <span
              className={`inline-flex items-center justify-center min-w-[120px] h-8 border-2 rounded px-2 text-sm transition-colors ${placed ? "bg-green-50 border-green-400 text-green-800 cursor-pointer" : draggedWord ? "border-dashed border-primary bg-primary/5" : "border-slate-300 bg-white text-slate-400"
                }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(num)}
              onDoubleClick={() => placed && setPlacedWords(prev => { const n = { ...prev }; delete n[num]; return n; })}
              title={placed ? "더블클릭하여 제거" : ""}
            >
              {placed || num}
            </span>
          </span>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  return (
    <div className="bg-[#d6dfe8] rounded-lg p-8">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        {title && <h2 className="text-lg font-bold text-center">{title}</h2>}
        {inputStyle === "items" ? (
          <ul className="space-y-2 list-disc pl-5">
            {items.filter(i => i.trim()).map((item, idx) => (
              <li key={idx} className="leading-[2] text-sm">
                {renderItemContent(item)}
              </li>
            ))}
          </ul>
        ) : (
          <div className="leading-[2] text-sm">{renderContent()}</div>
        )}
        <div className="pt-4 border-t mt-4">
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, i) => (
              <span key={`${word}-${i}`} draggable
                onDragStart={() => setDraggedWord(word)}
                onDragEnd={() => setDraggedWord(null)}
                className={`px-4 py-1.5 bg-white rounded border border-slate-300 cursor-grab hover:bg-slate-50 select-none text-sm ${draggedWord === word ? "opacity-50 scale-95" : ""
                  }`}>
                {word}
              </span>
            ))}
            {availableWords.length === 0 && wordBank.length > 0 && (
              <span className="text-sm text-muted-foreground">모든 단어가 사용되었습니다</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Writing 미리보기 컴포넌트
// =============================================================================
function WritingPreview({
  title,
  condition,
  prompt,
  imageUrl,
  minWords,
}: {
  title: string;
  condition: string;
  prompt: string;
  imageUrl: string;
  minWords?: string;
}) {
  const [wordCount, setWordCount] = useState(0);
  const [answerText, setAnswerText] = useState("");

  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAnswerText(text);
    setWordCount(countWords(text));
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border">
      {/* 타이틀 */}
      <div className="px-4 py-3 border-b bg-slate-50">
        <h2 className="font-bold text-lg">{title || "Writing Task"}</h2>
        {condition && (
          <p className="text-sm text-muted-foreground mt-1">{condition}</p>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex">
        {/* 왼쪽: 지문 */}
        <div className="flex-1 p-4 bg-[#d8dce8]">
          {stripHtml(prompt) ? (
            <div
              className="text-sm prose prose-sm max-w-none [&_p]:my-2 [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: prompt }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">(지문을 입력하세요)</p>
          )}

          {imageUrl && (
            <div className="mt-4 p-3 bg-white rounded border">
              <img src={imageUrl} alt="Task" className="max-w-full h-auto" />
            </div>
          )}
        </div>

        {/* 오른쪽: 답안 입력 영역 */}
        <div className="w-[350px] p-4 flex flex-col bg-slate-100">
          <textarea
            value={answerText}
            onChange={handleAnswerChange}
            className="flex-1 w-full border border-blue-400 rounded p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="답안을 입력하세요..."
            style={{ minHeight: "400px" }}
          />
          <div className="flex items-center justify-between mt-2 text-sm">
            <span>Word Count: {wordCount}</span>
            {minWords && (
              <span className={wordCount < parseInt(minWords) ? "text-red-500" : "text-green-600"}>
                최소 {minWords}단어
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 미리보기 다이얼로그
// =============================================================================
function PreviewDialog({
  open, onClose, questionType, format, instructions,
  contentTitle, contentHtml, blanks, wordBank,
  mcqQuestion, mcqOptions, mcqMaxSelections, mcqIsMultiple,
  tfngStatement, tfngAnswer,
  matchingTitle, matchingOptions, matchingItems, matchingAllowDuplicate,
  flowchartTitle, flowchartNodes, flowchartBlanks,
  writingTitle, writingCondition, writingPrompt, writingImageUrl, writingMinWords,
  speakingQuestion, cueCardTopic, cueCardPoints,
  tableInputMode, fillBlankDragAllowDuplicate, fillBlankItems, fillBlankInputStyle,
}: {
  open: boolean;
  onClose: () => void;
  questionType: QuestionType | null;
  format: QuestionFormat | null;
  instructions: string;
  contentTitle: string;
  contentHtml: string;
  blanks: Blank[];
  wordBank: string[];
  mcqQuestion: string;
  mcqOptions: MCQOption[];
  mcqMaxSelections: number;
  mcqIsMultiple: boolean;
  tfngStatement: string;
  tfngAnswer: "true" | "false" | "not_given";
  matchingTitle: string;
  matchingOptions: MatchingOption[];
  matchingItems: MatchingItem[];
  matchingAllowDuplicate: boolean;
  flowchartTitle: string;
  flowchartNodes: FlowchartNode[];
  flowchartBlanks: Blank[];
  writingTitle: string;
  writingCondition: string;
  writingPrompt: string;
  writingImageUrl: string;
  writingMinWords: string;
  speakingQuestion: string;
  cueCardTopic: string;
  cueCardPoints: string[];
  tableInputMode: "typing" | "drag";
  fillBlankDragAllowDuplicate: boolean;
  fillBlankItems: string[];
  fillBlankInputStyle: "editor" | "items";
}) {
  // [숫자] 형식을 빈칸 UI로 변환
  const renderContent = (text: string, blankList: Blank[]) => {
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
      return part.split('\n').map((line, i, arr) => (
        <span key={`${index}-${i}`}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

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
            {/* 지시문 */}
            {instructions && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">{instructions}</p>
              </div>
            )}

            {/* 빈칸채우기 (직접입력) */}
            {format === "fill_blank_typing" && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                {contentTitle && (
                  <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>
                )}
                {fillBlankInputStyle === "items" ? (
                  <ul className="space-y-2 list-disc pl-5">
                    {fillBlankItems.filter(i => i.trim()).map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {renderContent(item, blanks)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_strong]:font-bold">
                    {renderContent(contentHtml, blanks)}
                  </div>
                )}
              </div>
            )}

            {/* 빈칸채우기 (드래그앤드랍) */}
            {format === "fill_blank_drag" && (
              <FillBlankDragPreview
                title={contentTitle}
                content={contentHtml}
                blanks={blanks}
                wordBank={wordBank}
                allowDuplicate={fillBlankDragAllowDuplicate}
                items={fillBlankItems}
                inputStyle={fillBlankInputStyle}
              />
            )}

            {/* 테이블 완성하기 */}
            {format === "table_completion" && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                {contentTitle && <h2 className="text-lg font-bold border-b pb-3">{contentTitle}</h2>}
                <div
                  className="leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml.replace(
                      /\[(\d+)\]/g,
                      '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:22px;height:22px;background:#6366f1;color:white;font-size:11px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">$1</span><span style="display:inline-block;width:80px;height:28px;border-bottom:2px solid #6366f1;"></span></span>'
                    )
                  }}
                />
                {tableInputMode === "drag" && wordBank.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Word Bank</p>
                    <div className="flex flex-wrap gap-2">
                      {wordBank.map((word, i) => (
                        <span key={`${word}-${i}`} className="px-4 py-1.5 bg-white rounded border border-slate-300 text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MCQ (통합: 단일/복수 선택) */}
            {(format === "mcq" || format === "mcq_single" || format === "mcq_multiple") && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <p className="text-lg">{mcqQuestion || "(문제 입력)"}</p>
                {mcqIsMultiple && (
                  <p className="text-sm text-blue-600">Choose {mcqMaxSelections} answers.</p>
                )}
                <div className="space-y-3 mt-4">
                  {mcqOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className={`w-8 h-8 border-2 flex items-center justify-center ${mcqIsMultiple ? "rounded" : "rounded-full"}`}>
                        {option.label}
                      </div>
                      <span>{option.text || `(선택지 ${option.label})`}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* T/F/NG */}
            {format === "true_false_ng" && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="mb-4">{tfngStatement || "(진술문 입력)"}</p>
                  <div className="flex gap-2">
                    {["TRUE", "FALSE", "NOT GIVEN"].map((label) => (
                      <span key={label} className="px-4 py-2 border rounded text-sm cursor-pointer hover:bg-slate-50">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 제목 매칭 */}
            {format === "matching" && (
              <div className="grid grid-cols-[1fr_340px] gap-6">
                {/* 왼쪽: 지문 */}
                <div className="bg-white rounded-lg border p-6">
                  {matchingTitle && <h2 className="text-lg font-bold mb-4">{matchingTitle}</h2>}
                  <div
                    className="prose prose-sm max-w-none [&_p]:my-1 [&_strong]:font-bold"
                    dangerouslySetInnerHTML={{
                      __html: contentHtml.replace(
                        /\[(\d+)\]/g,
                        '<div style="display:inline-block;border:2px solid #94a3b8;border-radius:4px;padding:2px 24px;margin:8px 0;font-weight:bold;text-align:center;min-width:80px;">$1</div>'
                      )
                    }}
                  />
                </div>
                {/* 오른쪽: 제목 목록 */}
                <div className="bg-white rounded-lg border p-4 h-fit">
                  <h3 className="font-semibold mb-1">List of Headings</h3>
                  <p className="text-xs text-muted-foreground mb-4">Choose the correct heading for each section.</p>
                  {matchingAllowDuplicate && (
                    <p className="text-xs text-blue-600 mb-3">* 같은 제목을 여러 번 사용할 수 있습니다</p>
                  )}
                  <div className="space-y-2">
                    {matchingOptions.map((option) => (
                      <div key={option.id} className="px-4 py-2.5 bg-slate-50 rounded-lg border cursor-grab hover:bg-slate-100">
                        <span className="font-semibold">{option.text || `(제목 ${option.label} 입력)`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 플로우차트 */}
            {format === "flowchart" && (() => {
              const rowMap = new Map<number, FlowchartNode[]>();
              for (const n of flowchartNodes) {
                const row = n.row ?? 0;
                if (!rowMap.has(row)) rowMap.set(row, []);
                rowMap.get(row)!.push(n);
              }
              for (const [, group] of rowMap) {
                group.sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
              }
              const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

              return (
                <div className="bg-white rounded-lg border p-6">
                  {flowchartTitle && (
                    <h2 className="text-lg font-bold text-center mb-6">{flowchartTitle}</h2>
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
                              <div className="flex items-end" style={{ width: `${Math.min(group.length * 200, 600)}px` }}>
                                {group.map((_, i) => (
                                  <div key={i} className="flex-1 border-t-2 border-slate-400 h-0" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Node row */}
                          {isBranch ? (
                            <div className="flex justify-center gap-3">
                              {group.map((node) => (
                                <div key={node.id} className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50 min-w-[160px] text-center">
                                  {node.label && <div className="font-semibold text-blue-700 mb-1 text-xs">{node.label}</div>}
                                  <div className="text-sm">{renderContent(node.content || "(내용 입력)", flowchartBlanks)}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="p-4 rounded-lg border-2 border-slate-300 bg-slate-50 min-w-[200px] text-center">
                                <div className="text-sm">{renderContent(group[0].content || "(내용 입력)", flowchartBlanks)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Writing */}
            {format === "essay" && (
              <WritingPreview
                title={writingTitle}
                condition={writingCondition}
                prompt={writingPrompt}
                imageUrl={writingImageUrl}
                minWords={writingMinWords}
              />
            )}

            {/* Speaking Part 1 & 3 */}
            {(format === "speaking_part1" || format === "speaking_part3") && (
              <div className="bg-white rounded-lg border p-6">
                <p className="text-xl font-medium">{speakingQuestion || "(질문 입력)"}</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-muted-foreground">녹음 버튼을 눌러 답변하세요</p>
                </div>
              </div>
            )}

            {/* Speaking Part 2 */}
            {format === "speaking_part2" && (
              <div className="bg-white rounded-lg border p-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
                  <p className="text-lg font-medium mb-4">{cueCardTopic || "(주제 입력)"}</p>
                  <p className="text-sm text-muted-foreground mb-2">You should say:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {cueCardPoints.map((point, i) => (
                      <li key={i}>{point || `(포인트 ${i + 1})`}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-muted-foreground">1분간 준비 후 1~2분간 답변하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
