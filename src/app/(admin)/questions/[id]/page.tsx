"use client";

import { useState, useEffect, use, useRef } from "react";
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

  // Speaking
  const [speakingQuestion, setSpeakingQuestion] = useState("");
  const [cueCardTopic, setCueCardTopic] = useState("");
  const [cueCardPoints, setCueCardPoints] = useState<string[]>(["", "", "", ""]);
  const [generateFollowup, setGenerateFollowup] = useState(false);

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
            if (format === "fill_blank_drag" && optionsData.word_bank) {
              setWordBank(optionsData.word_bank);
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
        // Writing
        else if (format === "essay") {
          setWritingPrompt(content || "");
          if (optionsData) {
            setWritingTitle(optionsData.title || "");
            setWritingCondition(optionsData.condition || "");
            setWritingImageUrl(optionsData.image_url || "");
          }
        }
        // Speaking Part 1 & 3
        else if (format === "speaking_part1" || format === "speaking_part3") {
          setSpeakingQuestion(content);
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
        }
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
    }]);
  };

  const addFlowchartBlank = () => {
    const nextNum = flowchartBlanks.length > 0 ? Math.max(...flowchartBlanks.map(b => b.number)) + 1 : 1;
    setFlowchartBlanks([...flowchartBlanks, { id: `fb${Date.now()}`, number: nextNum, answer: "", alternatives: [] }]);
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
          ...(selectedFormat === "fill_blank_drag" ? { word_bank: wordBank } : {}),
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
      // Writing
      else if (selectedFormat === "essay") {
        content = writingPrompt;
        optionsData = {
          title: writingTitle || null,
          condition: writingCondition || null,
          image_url: writingImageUrl || null,
        };
      }
      // Speaking
      else if (selectedFormat === "speaking_part1" || selectedFormat === "speaking_part3") {
        content = speakingQuestion;
      }
      else if (selectedFormat === "speaking_part2") {
        content = JSON.stringify({
          topic: cueCardTopic,
          points: cueCardPoints,
        });
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
        tags: (selectedFormat !== "mcq" && selectedFormat !== "true_false_ng") && tags ? tags.split(",").map(t => t.trim()) : null,
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
        {/* 왼쪽: 설정 패널 (MCQ, T/F/NG 제외) */}
        {selectedFormat !== "mcq" && selectedFormat !== "true_false_ng" && (
        <div className="w-80 border-r bg-slate-50 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* 기본 설정 */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">기본 설정</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">연습 문제</Label>
                  <p className="text-xs text-muted-foreground">
                    생성 후 변경 불가
                  </p>
                </div>
                <Switch
                  checked={isPractice}
                  disabled
                />
              </div>

            </div>

            {/* 유형별 추가 설정 */}
            {selectedFormat === "fill_blank_drag" && (
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
        )}

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
                setIsMultiple={setMcqIsMultiple}
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
                addBlank={addFlowchartBlank}
                updateBlank={(id, field, value) => {
                  setFlowchartBlanks(flowchartBlanks.map(b => b.id === id ? { ...b, [field]: value } : b));
                }}
                removeBlank={(id) => setFlowchartBlanks(flowchartBlanks.filter(b => b.id !== id))}
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
              />
            )}

            {/* Speaking Part 1 & 3 */}
            {(selectedFormat === "speaking_part1" || selectedFormat === "speaking_part3") && (
              <SpeakingQuestionEditor
                question={speakingQuestion}
                setQuestion={setSpeakingQuestion}
                part={selectedFormat === "speaking_part1" ? 1 : 3}
              />
            )}

            {/* Speaking Part 2 */}
            {selectedFormat === "speaking_part2" && (
              <SpeakingPart2Editor
                topic={cueCardTopic}
                setTopic={setCueCardTopic}
                points={cueCardPoints}
                setPoints={setCueCardPoints}
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
        speakingQuestion={speakingQuestion}
        cueCardTopic={cueCardTopic}
        cueCardPoints={cueCardPoints}
      />
    </div>
  );
}

// =============================================================================
// 빈칸채우기 에디터
// =============================================================================
function FillBlankEditor({
  title, setTitle, content, setContent, blanks, setBlanks, blankMode, setBlankMode,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  blanks: Blank[]; setBlanks: (v: Blank[]) => void;
  blankMode: "word" | "sentence"; setBlankMode: (v: "word" | "sentence") => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());
  const blanksRef = useRef(blanks);
  blanksRef.current = blanks;

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false })],
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
    setContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromSelection = () => {
    if (!contextMenu || !editor) return;
    const { text, from, to } = contextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
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
    setBlanks(blanks.map(b => b.id === id ? { ...b, answer: clean } : b));
  };

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>
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
            if (content.trim() || blanks.length > 0) {
              setContent("");
              setBlanks([]);
              toast.info("모드가 변경되어 내용이 초기화되었습니다");
            }
            setBlankMode(newMode);
          }}
        />
        <span className={`text-sm font-medium ${blankMode === "sentence" ? "text-primary" : "text-muted-foreground"}`}>문장형</span>
      </div>

      <div className="space-y-2">
        <Label>지문 *</Label>
        <p className="text-xs text-muted-foreground">
          단어를 드래그로 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
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
// 빈칸채우기 드래그앤드랍 에디터 (TipTap + 우클릭 빈칸 생성)
// =============================================================================
function FillBlankDragEditor({
  title, setTitle, content, setContent, blanks, setBlanks, wordBank, setWordBank, blankMode, setBlankMode,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  blanks: Blank[]; setBlanks: (v: Blank[]) => void;
  wordBank: string[]; setWordBank: (v: string[]) => void;
  blankMode: "word" | "sentence"; setBlankMode: (v: "word" | "sentence") => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());
  const blanksRef = useRef(blanks);
  const wordBankRef = useRef(wordBank);
  blanksRef.current = blanks;
  wordBankRef.current = wordBank;

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false })],
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
      // 중복 번호 감지
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
    setContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromSelection = () => {
    if (!contextMenu || !editor) return;
    const { text, from, to } = contextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
    if (!wordBank.includes(text)) setWordBank([...wordBank, text]);
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

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>
      <div className="space-y-2">
        <Label>제목</Label>
        <Input placeholder="예: Marie Curie's research on radioactivity" value={title}
          onChange={(e) => setTitle(e.target.value)} className="text-lg font-medium" />
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <span className={`text-sm font-medium ${blankMode === "word" ? "text-primary" : "text-muted-foreground"}`}>워드형</span>
        <Switch
          checked={blankMode === "sentence"}
          onCheckedChange={(checked) => {
            const newMode = checked ? "sentence" : "word";
            if (content.trim() || blanks.length > 0) {
              setContent("");
              setBlanks([]);
              setWordBank([]);
              toast.info("모드가 변경되어 내용이 초기화되었습니다");
            }
            setBlankMode(newMode);
          }}
        />
        <span className={`text-sm font-medium ${blankMode === "sentence" ? "text-primary" : "text-muted-foreground"}`}>문장형</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <RequiredLabel required>내용</RequiredLabel>
          <p className="text-xs text-muted-foreground">
            단어를 드래그 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / <code className="bg-slate-100 px-1 rounded">[번호]</code> 직접 입력 가능
          </p>
        </div>
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
                  className={`px-3 py-1 rounded-md text-sm border cursor-grab active:cursor-grabbing select-none transition-all ${
                    dragIdx === i ? "opacity-40 scale-95" : ""} ${
                    dragOverIdx === i && dragIdx !== i ? "ring-2 ring-primary ring-offset-1" : ""} ${
                    isAnswer ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
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
              className={`w-10 h-10 flex items-center justify-center font-medium cursor-pointer transition-all ${
                isMultiple
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
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all border-2 ${
                answer === opt
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

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false })],
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
        toast.warning(`중복된 섹션 번호가 있습니다: [${[...duplicates].join("], [")}]`);
      }
      const uniqueNums = [...new Set(foundNums)];
      const curr = itemsRef.current;
      let updated = [...curr];
      let changed = false;
      for (const num of uniqueNums) {
        if (!updated.some(i => i.number === num)) {
          updated.push({ id: `m${Date.now()}-${num}`, number: num, statement: "", correctLabel: "" });
          changed = true;
        }
      }
      const before = updated.length;
      updated = updated.filter(i => uniqueNums.includes(i.number));
      if (updated.length !== before) changed = true;
      updated.sort((a, b) => a.number - b.number);
      if (changed) setItems(updated);
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
    const nums = items.map(i => i.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    editor.chain().focus().insertContent(`[${nextNum}]`).run();
    setContextMenu(null);
  };

  const removeSectionMarker = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !editor) return;
    const html = editor.getHTML();
    const newHtml = html.replace(`[${item.number}]`, "");
    editor.commands.setContent(newHtml);
  };

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>
      <div className="space-y-2">
        <Label>지문 제목 *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" />
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
        <div>
          <Label className="text-sm">같은 제목 중복 사용 허용</Label>
          <p className="text-xs text-muted-foreground">활성화 시 같은 제목을 여러 섹션에 사용 가능</p>
        </div>
        <Switch checked={allowDuplicate} onCheckedChange={setAllowDuplicate} />
      </div>

      <div className="space-y-2">
        <Label>지문 *</Label>
        <p className="text-xs text-muted-foreground">
          지문을 입력 후 섹션 시작 위치에서 <strong>우클릭</strong> → 섹션 마커 삽입 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
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
                섹션 마커 삽입 [{items.length > 0 ? Math.max(...items.map(i => i.number)) + 1 : 1}]
              </button>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <Label>섹션 목록 ({items.length}개)</Label>
          <div className="border rounded-lg divide-y">
            {items.map((item) => (
              <div key={item.id} className="px-3 py-2 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{item.number}</span>
                <Select value={item.correctLabel} onValueChange={(v) => setItems(items.map(i => i.id === item.id ? { ...i, correctLabel: v } : i))}>
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue placeholder="정답 제목 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.id} value={o.label}>{o.label}: {o.text || "(미입력)"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeSectionMarker(item.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>제목 목록 (List of Headings) *</Label>
            <p className="text-xs text-muted-foreground mt-0.5">학생이 선택할 제목 보기입니다. 정답 + 함정 제목을 모두 추가하세요.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            제목 추가
          </Button>
        </div>
        <div className="border rounded-lg divide-y">
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                {option.label}
              </span>
              <Input className="flex-1 h-9" value={option.text} onChange={(e) => updateOption(option.id, e.target.value)} placeholder={`제목 ${option.label} 입력`} />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(option.id)}>
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 플로우차트 에디터
// =============================================================================
function FlowchartEditor({
  title, setTitle, nodes, setNodes, addNode, blanks, addBlank, updateBlank, removeBlank
}: {
  title: string;
  setTitle: (v: string) => void;
  nodes: FlowchartNode[];
  setNodes: (v: FlowchartNode[]) => void;
  addNode: (type: "box" | "branch") => void;
  blanks: Blank[];
  addBlank: () => void;
  updateBlank: (id: string, field: keyof Blank, value: unknown) => void;
  removeBlank: (id: string) => void;
}) {
  const [expandedBlank, setExpandedBlank] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>플로우차트 제목</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: How a caloric-restriction mimetic works"
          className="text-lg font-medium"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <RequiredLabel required>노드</RequiredLabel>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addNode("box")}>
              <Plus className="mr-2 h-4 w-4" />
              박스 추가
            </Button>
            <Button variant="outline" size="sm" onClick={() => addNode("branch")}>
              <GitBranch className="mr-2 h-4 w-4" />
              분기 추가
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          빈칸 위치: <code className="bg-slate-100 px-1 rounded">{`[39]`}</code> 형식으로 입력
        </p>

        <div className="space-y-2">
          {nodes.map((node, index) => (
            <div key={node.id} className="relative">
              {index > 0 && (
                <div className="flex justify-center py-2">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-400" />
                </div>
              )}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${node.type === "branch" ? "bg-blue-50 border border-blue-200" : "bg-slate-50 border"}`}>
                <Badge variant={node.type === "branch" ? "default" : "outline"}>
                  {node.type === "branch" ? "분기" : "박스"}
                </Badge>
                {node.type === "branch" && (
                  <Input
                    value={node.label || ""}
                    onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                    placeholder="라벨"
                    className="w-32"
                  />
                )}
                <Input
                  value={node.content}
                  onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
                  placeholder={node.type === "branch" ? "분기 내용" : "박스 내용"}
                  className="flex-1"
                />
                {nodes.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setNodes(nodes.filter(n => n.id !== node.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <RequiredLabel required>빈칸 정답</RequiredLabel>
          <Button variant="outline" size="sm" onClick={addBlank}>
            <Plus className="mr-2 h-4 w-4" />
            빈칸 추가
          </Button>
        </div>

        <div className="border rounded-lg divide-y">
          {blanks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">빈칸 정답을 추가하세요</p>
            </div>
          ) : (
            blanks.map((blank) => (
              <div key={blank.id} className="p-3 space-y-2">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={blank.number}
                    onChange={(e) => updateBlank(blank.id, "number", parseInt(e.target.value) || 0)}
                    className="w-16 h-9 text-center font-mono"
                  />
                  <Input
                    value={blank.answer}
                    onChange={(e) => updateBlank(blank.id, "answer", e.target.value)}
                    placeholder="정답"
                    className="flex-1 h-9"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedBlank(expandedBlank === blank.id ? null : blank.id)}
                    className="text-xs"
                  >
                    {expandedBlank === blank.id ? "접기" : `대체 ${blank.alternatives?.length || 0}`}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeBlank(blank.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {expandedBlank === blank.id && (
                  <div className="ml-20 space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">대체 정답</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateBlank(blank.id, "alternatives", [...(blank.alternatives || []), ""])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    </div>
                    {(blank.alternatives || []).map((alt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={alt}
                          onChange={(e) => {
                            const alts = [...(blank.alternatives || [])];
                            alts[i] = e.target.value;
                            updateBlank(blank.id, "alternatives", alts);
                          }}
                          placeholder={`대체 ${i + 1}`}
                          className="h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateBlank(blank.id, "alternatives", (blank.alternatives || []).filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
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
  imageUrl, setImageUrl
}: {
  title: string;
  setTitle: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 타이틀 */}
      <div className="space-y-2">
        <RequiredLabel required>타이틀</RequiredLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: Academic Writing Task 1"
        />
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

      {/* 이미지 URL (선택) */}
      <div className="space-y-2">
        <Label>이미지 URL (선택)</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/chart.png"
        />
        {imageUrl && (
          <div className="mt-2 p-4 border rounded-lg bg-slate-50">
            <img src={imageUrl} alt="이미지" className="max-w-full h-auto rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Speaking 에디터
// =============================================================================
function SpeakingQuestionEditor({
  question, setQuestion, part
}: {
  question: string;
  setQuestion: (v: string) => void;
  part: 1 | 3;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          {part === 1
            ? "Part 1: 일상적인 주제에 대한 질문입니다. 학생은 30초~1분 정도의 짧은 답변을 합니다."
            : "Part 3: Part 2 주제와 연관된 심화 토론 질문입니다."}
        </p>
      </div>

      <div className="space-y-2">
        <RequiredLabel required>질문</RequiredLabel>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={part === 1 ? "예: What is your hometown like?" : "예: Do you think reading habits have changed?"}
          rows={3}
        />
      </div>
    </div>
  );
}

function SpeakingPart2Editor({
  topic, setTopic, points, setPoints
}: {
  topic: string;
  setTopic: (v: string) => void;
  points: string[];
  setPoints: (v: string[]) => void;
}) {
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
    </div>
  );
}

// =============================================================================
// 빈칸채우기 (드래그앤드랍) 미리보기 컴포넌트
// =============================================================================
function FillBlankDragPreview({
  title, content, blanks, wordBank,
}: {
  title: string; content: string; blanks: Blank[]; wordBank: string[];
}) {
  const [placedWords, setPlacedWords] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const availableWords = wordBank.filter(w => w && !Object.values(placedWords).includes(w));

  const handleDrop = (num: number) => {
    if (draggedWord) {
      setPlacedWords(prev => ({ ...prev, [num]: draggedWord }));
      setDraggedWord(null);
    }
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
              className={`inline-flex items-center justify-center min-w-[120px] h-8 border-2 rounded px-2 text-sm transition-colors ${
                placed ? "bg-green-50 border-green-400 text-green-800 cursor-pointer" : draggedWord ? "border-dashed border-primary bg-primary/5" : "border-slate-300 bg-white text-slate-400"
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
        <div className="leading-[2] text-sm">{renderContent()}</div>
        <div className="pt-4 border-t mt-4">
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, i) => (
              <span key={`${word}-${i}`} draggable
                onDragStart={() => setDraggedWord(word)}
                onDragEnd={() => setDraggedWord(null)}
                className={`px-4 py-1.5 bg-white rounded border border-slate-300 cursor-grab hover:bg-slate-50 select-none text-sm ${
                  draggedWord === word ? "opacity-50 scale-95" : ""
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
}: {
  title: string;
  condition: string;
  prompt: string;
  imageUrl: string;
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
          <p className="text-sm mt-2">
            Word Count: {wordCount}
          </p>
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
  writingTitle, writingCondition, writingPrompt, writingImageUrl,
  speakingQuestion, cueCardTopic, cueCardPoints
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
  speakingQuestion: string;
  cueCardTopic: string;
  cueCardPoints: string[];
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
                <div className="leading-relaxed whitespace-pre-wrap">
                  {renderContent(contentHtml, blanks)}
                </div>
              </div>
            )}

            {/* 빈칸채우기 (드래그앤드랍) */}
            {format === "fill_blank_drag" && (
              <FillBlankDragPreview
                title={contentTitle}
                content={contentHtml}
                blanks={blanks}
                wordBank={wordBank}
              />
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                  Do the following statements agree with the information given in the passage?
                  <div className="mt-2 text-xs">
                    <strong>TRUE</strong> if the statement agrees with the information<br/>
                    <strong>FALSE</strong> if the statement contradicts the information<br/>
                    <strong>NOT GIVEN</strong> if there is no information on this
                  </div>
                </div>
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
            {format === "flowchart" && (
              <div className="bg-white rounded-lg border p-6">
                {flowchartTitle && (
                  <h2 className="text-lg font-bold text-center mb-6">{flowchartTitle}</h2>
                )}
                <div className="flex flex-col items-center gap-2">
                  {flowchartNodes.map((node, index) => (
                    <div key={node.id}>
                      {index > 0 && (
                        <div className="flex justify-center py-2">
                          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-400" />
                        </div>
                      )}
                      <div className={`p-4 rounded-lg border-2 min-w-[200px] text-center ${
                        node.type === "branch" ? "border-blue-300 bg-blue-50" : "border-slate-300 bg-slate-50"
                      }`}>
                        {node.label && <div className="font-semibold mb-1">{node.label}</div>}
                        <div className="text-sm">{renderContent(node.content || "(내용 입력)", flowchartBlanks)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing */}
            {format === "essay" && (
              <WritingPreview
                title={writingTitle}
                condition={writingCondition}
                prompt={writingPrompt}
                imageUrl={writingImageUrl}
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
