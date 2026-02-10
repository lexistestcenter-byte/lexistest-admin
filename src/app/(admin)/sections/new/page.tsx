"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  GripVertical,
  Save,
  ArrowLeft,
  ArrowRight,
  Search,
  Loader2,
  Eye,
  Check,
  FileText,
  Headphones,
  ListChecks,
  Plus,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SectionPreview, type PreviewQuestion } from "./section-preview";
import { FileUpload, uploadFile } from "@/components/ui/file-upload";
import { formatLabels, typeColors } from "@/components/sections/constants";
import { QuestionDetailPreview } from "@/components/sections/question-detail-preview";
import { stripHtml } from "@/lib/utils/sanitize";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CreateQuestionModal } from "@/components/sections/create-question-modal";

// ─── Types ─────────────────────────────────────────────────────

interface Question {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  difficulty: string | null;
  is_active: boolean;
  item_count: number;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
}

interface ContentBlock {
  id: string;
  content_type: "passage" | "audio";
  display_order: number;
  passage_title: string;
  passage_content: string;
  passage_footnotes: string;
  audio_url: string;
  audio_transcript: string;
  audioFile?: File | null;
}

interface QuestionGroup {
  id: string;
  content_block_id: string | null;
  display_order: number;
  title: string;
  instructions: string;
  questions: string[];
}

// ─── Constants ─────────────────────────────────────────────────

const TOTAL_STEPS = 2;
const STEP_LABELS = ["기본 정보", "섹션 구성"];

let tempIdCounter = 0;
function generateTempId() {
  return `temp-${++tempIdCounter}-${Date.now()}`;
}

// ─── Sortable Components ───────────────────────────────────────

function SortableQuestionInGroup({
  id,
  numberLabel,
  question,
  onRemove,
}: {
  id: string;
  numberLabel: string;
  question: Question;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("bg-muted/50 rounded", isDragging && "shadow-lg")}
    >
      <div className="flex items-center gap-2 p-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-xs font-mono font-semibold text-primary min-w-[50px]">
          {numberLabel}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {question.question_code}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {formatLabels[question.question_format] || question.question_format}
        </Badge>
        <span className="flex-1 text-xs text-muted-foreground">
          {stripHtml(question.title || question.content)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setExpanded(!expanded)}
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && <QuestionDetailPreview question={question} />}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function NewSectionPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>(
    []
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Form state
  const [sectionType, setSectionType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [isPractice, setIsPractice] = useState(false);
  const [instructionTitle, setInstructionTitle] = useState<string>("");
  const [instructionHtml, setInstructionHtml] = useState<string>("");

  // Content blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Question groups
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Available questions
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedForAdd, setSelectedForAdd] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  // 문제 생성 모달
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);

  // ─── Content Block helpers ─────────────────────────────────

  const addContentBlock = () => {
    const contentType = sectionType === "listening" ? "audio" : "passage";
    const newBlock: ContentBlock = {
      id: generateTempId(),
      content_type: contentType as "passage" | "audio",
      display_order: contentBlocks.length,
      passage_title: "",
      passage_content: "",
      passage_footnotes: "",
      audio_url: "",
      audio_transcript: "",
    };
    setContentBlocks((prev) => [...prev, newBlock]);
  };

  const updateContentBlock = (id: string, data: Partial<ContentBlock>) => {
    setContentBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
  };

  const removeContentBlock = (id: string) => {
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
    setQuestionGroups((prev) =>
      prev.map((g) =>
        g.content_block_id === id ? { ...g, content_block_id: null } : g
      )
    );
  };

  const addSet = () => {
    const contentType = sectionType === "listening" ? "audio" : "passage";
    const needsContent = sectionType === "reading" || sectionType === "listening";
    const newBlockId = needsContent ? generateTempId() : null;

    if (needsContent && newBlockId) {
      setContentBlocks((prev) => [
        ...prev,
        {
          id: newBlockId,
          content_type: contentType as "passage" | "audio",
          display_order: prev.length,
          passage_title: "",
          passage_content: "",
          passage_footnotes: "",
          audio_url: "",
          audio_transcript: "",
        },
      ]);
    }

    const newGroupId = generateTempId();
    setQuestionGroups((prev) => [
      ...prev,
      {
        id: newGroupId,
        content_block_id: newBlockId,
        display_order: prev.length,
        title: "",
        instructions: "",
        questions: [],
      },
    ]);
    setActiveGroupId(newGroupId);
  };

  const removeSet = (groupId: string) => {
    const group = questionGroups.find((g) => g.id === groupId);
    if (group?.content_block_id) {
      setContentBlocks((prev) =>
        prev.filter((b) => b.id !== group.content_block_id)
      );
    }
    setQuestionGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      const remaining = questionGroups.filter((g) => g.id !== groupId);
      setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  useEffect(() => {
    if (sectionType && questionGroups.length === 0) {
      addSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionType]);

  // ─── Question Group helpers ────────────────────────────────

  const addQuestionGroup = () => {
    const newGroup: QuestionGroup = {
      id: generateTempId(),
      content_block_id: contentBlocks.length > 0 ? contentBlocks[0].id : null,
      display_order: questionGroups.length,
      title: "",
      instructions: "",
      questions: [],
    };
    setQuestionGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const updateQuestionGroup = (id: string, data: Partial<QuestionGroup>) => {
    setQuestionGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
  };

  const removeQuestionGroup = (id: string) => {
    setQuestionGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeGroupId === id) {
      setActiveGroupId(questionGroups.find((g) => g.id !== id)?.id || null);
    }
  };

  const addQuestionsToGroup = (groupId: string) => {
    if (selectedForAdd.length === 0) return;
    setQuestionGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const existing = new Set(g.questions);
        const newQs = selectedForAdd.filter((qId) => !existing.has(qId));
        return { ...g, questions: [...g.questions, ...newQs] };
      })
    );
    setSelectedForAdd([]);
  };

  const removeQuestionFromGroup = (groupId: string, questionId: string) => {
    setQuestionGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, questions: g.questions.filter((q) => q !== questionId) };
      })
    );
  };

  // ─── Number Calculation ────────────────────────────────────

  const numberingMap = (() => {
    const map: Record<
      string,
      { startNum: number; endNum: number; label: string }
    > = {};
    let currentNum = 1;
    for (const group of questionGroups) {
      for (const qId of group.questions) {
        const q = availableQuestions.find((aq) => aq.id === qId);
        const itemCount = q?.item_count || 1;
        const startNum = currentNum;
        const endNum = startNum + itemCount - 1;
        map[qId] = {
          startNum,
          endNum,
          label: itemCount > 1 ? `Q${startNum}-${endNum}` : `Q${startNum}`,
        };
        currentNum += itemCount;
      }
    }
    return map;
  })();

  const groupNumbering = (() => {
    const map: Record<string, { startNum: number; endNum: number }> = {};
    let currentNum = 1;
    for (const group of questionGroups) {
      const groupStart = currentNum;
      for (const qId of group.questions) {
        const q = availableQuestions.find((aq) => aq.id === qId);
        currentNum += q?.item_count || 1;
      }
      map[group.id] = { startNum: groupStart, endNum: currentNum - 1 };
    }
    return map;
  })();

  const totalItemCount = Object.values(numberingMap).reduce(
    (sum, n) => Math.max(sum, n.endNum),
    0
  );

  const allUsedQuestionIds = new Set(
    questionGroups.flatMap((g) => g.questions)
  );

  // Auto-generate group title from question number ranges
  // e.g. "Questions 5–6 and 7–8" or "Questions 1–4, 5–8 and 9–13"
  const generateGroupTitle = (group: QuestionGroup): string => {
    const ranges: string[] = [];
    let totalItems = 0;
    for (const qId of group.questions) {
      const num = numberingMap[qId];
      if (!num) continue;
      totalItems += num.endNum - num.startNum + 1;
      ranges.push(
        num.startNum === num.endNum
          ? `${num.startNum}`
          : `${num.startNum}–${num.endNum}`
      );
    }
    if (ranges.length === 0) return "";
    const prefix = totalItems === 1 ? "Question" : "Questions";
    if (ranges.length === 1) return `${prefix} ${ranges[0]}`;
    if (ranges.length === 2) return `${prefix} ${ranges[0]} and ${ranges[1]}`;
    const last = ranges.pop()!;
    return `${prefix} ${ranges.join(", ")} and ${last}`;
  };

  // ─── Load available questions ──────────────────────────────

  const loadAvailableQuestions = useCallback(async () => {
    if (!sectionType) {
      setAvailableQuestions([]);
      return;
    }

    setIsLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      params.set("question_type", sectionType);
      params.set("is_active", "true");
      params.set("is_practice", isPractice ? "true" : "false");
      params.set("limit", "100");
      if (searchQuery) params.set("search", searchQuery);

      const { data: result, error } = await api.get<{ questions: Question[] }>(`/api/questions?${params.toString()}`);
      if (error) throw new Error(error);
      setAvailableQuestions(result?.questions || []);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [sectionType, searchQuery, isPractice]);

  useEffect(() => {
    loadAvailableQuestions();
  }, [loadAvailableQuestions]);

  useEffect(() => {
    const timer = setTimeout(() => loadAvailableQuestions(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 모달에서 문제 생성 완료 시
  const handleQuestionCreated = useCallback(
    async (questionId: string) => {
      // 현재 활성 그룹에 자동 추가
      if (activeGroupId) {
        setQuestionGroups((prev) =>
          prev.map((g) => {
            if (g.id !== activeGroupId) return g;
            if (g.questions.includes(questionId)) return g;
            return { ...g, questions: [...g.questions, questionId] };
          })
        );
      }
      // 문제 목록 새로고침
      await loadAvailableQuestions();
    },
    [activeGroupId, loadAvailableQuestions]
  );

  // ─── Step validation ───────────────────────────────────────

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!sectionType) {
        toast.error("섹션 유형을 선택해주세요.");
        return false;
      }
      if (!title.trim()) {
        toast.error("섹션명을 입력해주세요.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep))
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ─── Save ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (!sectionType || !title) {
      toast.error("섹션 유형과 제목은 필수입니다.");
      return;
    }

    // 최소 1세트에 1개 이상의 문제가 있어야 저장 가능
    const hasValidGroup = questionGroups.some((g) => g.questions.length > 0);
    if (!hasValidGroup) {
      toast.error("최소 1개 세트에 문제가 1개 이상 추가되어야 저장할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const sectionData = {
        section_type: sectionType,
        title,
        description: description || null,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        is_practice: isPractice,
        is_active: true,
        instruction_title: instructionTitle || null,
        instruction_html: instructionHtml || null,
      };

      const { data: newSection, error: sectionError } = await api.post<{ id: string }>("/api/sections", sectionData);
      if (sectionError) throw new Error(sectionError);
      const sectionId = newSection!.id;

      // Content blocks
      const blockIdMap: Record<string, string> = {};
      const pendingAudioBlocks: { blockId: string; file: File }[] = [];

      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        const hasPendingFile = !!block.audioFile;

        const { data: result, error: blockError } = await api.post<{ block_id: string }>(`/api/sections/${sectionId}/content-blocks`, {
          display_order: i,
          content_type: block.content_type,
          passage_title: block.passage_title || null,
          passage_content: block.passage_content || null,
          passage_footnotes: block.passage_footnotes || null,
          // deferred 파일이 있으면 URL 제외 (blob URL이므로)
          audio_url: hasPendingFile ? null : (block.audio_url || null),
        });
        if (!blockError && result) {
          blockIdMap[block.id] = result.block_id;
          // pending 파일 기록
          if (hasPendingFile && block.audioFile) {
            pendingAudioBlocks.push({ blockId: result.block_id, file: block.audioFile });
          }
        }
      }

      // pending 오디오 파일 업로드 후 콘텐츠 블록 업데이트
      for (const pending of pendingAudioBlocks) {
        const context = `sections/${sectionId}`;
        const uploaded = await uploadFile(pending.file, "audio", context);
        // 블록 업데이트 (upsert with block_id)
        await api.post(`/api/sections/${sectionId}/content-blocks`, {
          block_id: pending.blockId,
          audio_url: uploaded.path,
        });
      }

      // Question groups + items
      let currentNumber = 1;
      for (let gi = 0; gi < questionGroups.length; gi++) {
        const group = questionGroups[gi];
        const serverBlockId = group.content_block_id
          ? blockIdMap[group.content_block_id] || null
          : null;

        const { data: groupResult, error: groupError } = await api.post<{ group_id: string }>(`/api/sections/${sectionId}/groups`, {
          content_block_id: serverBlockId,
          display_order: gi,
          title: group.title || null,
          instructions: group.instructions || null,
          question_number_start: currentNumber,
        });

        if (groupError || !groupResult) continue;
        const serverGroupId = groupResult.group_id;

        for (let qi = 0; qi < group.questions.length; qi++) {
          const questionId = group.questions[qi];
          const question = availableQuestions.find((q) => q.id === questionId);
          const itemCount = question?.item_count || 1;

          await api.post(`/api/sections/${sectionId}/groups/${serverGroupId}/items`, {
            question_id: questionId,
            question_number_start: currentNumber,
            display_order: qi,
          });

          currentNumber += itemCount;
        }
      }

      toast.success("섹션이 생성되었습니다.");
      router.push("/sections");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error(
        error instanceof Error ? error.message : "섹션 생성에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Preview ───────────────────────────────────────────────

  const openPreview = async () => {
    const allQuestionIds = questionGroups.flatMap((g) => g.questions);
    if (allQuestionIds.length === 0) {
      setShowPreview(true);
      return;
    }
    setIsLoadingPreview(true);
    try {
      const uniqueIds = [...new Set(allQuestionIds)];
      const details = await Promise.all(
        uniqueIds.map(async (qId) => {
          const { data, error } = await api.get<{ question: PreviewQuestion }>(`/api/questions/${qId}`);
          if (error) throw new Error(error);
          return data!.question;
        })
      );
      const detailMap = new Map(details.map((d) => [d.id, d]));
      setPreviewQuestions(
        allQuestionIds
          .map((qId) => detailMap.get(qId))
          .filter((q): q is PreviewQuestion => q !== undefined)
      );
      setShowPreview(true);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("미리보기 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ─── DnD ───────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBlockDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setContentBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === String(active.id));
        const newIndex = prev.findIndex((b) => b.id === String(over.id));
        return arrayMove(prev, oldIndex, newIndex).map((b, i) => ({
          ...b,
          display_order: i,
        }));
      });
    }
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestionGroups((prev) => {
        const oldIndex = prev.findIndex((g) => g.id === String(active.id));
        const newIndex = prev.findIndex((g) => g.id === String(over.id));
        return arrayMove(prev, oldIndex, newIndex).map((g, i) => ({
          ...g,
          display_order: i,
        }));
      });
    }
  };

  const handleItemDragEnd =
    (groupId: string) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setQuestionGroups((prev) =>
          prev.map((g) => {
            if (g.id !== groupId) return g;
            const oldIndex = g.questions.indexOf(String(active.id));
            const newIndex = g.questions.indexOf(String(over.id));
            return {
              ...g,
              questions: arrayMove(g.questions, oldIndex, newIndex),
            };
          })
        );
      }
    };

  // ─── Step Indicator ────────────────────────────────────────

  const renderStepIndicator = () => (
    <div>
      <div className="flex items-center justify-center gap-0">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = currentStep > step;
          const isCurrent = currentStep === step;
          return (
            <div key={step} className="flex items-center">
              {idx > 0 && (
                <div
                  className={cn(
                    "h-px w-12 sm:w-20",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (step === currentStep) return;
                  if (step < currentStep) {
                    setCurrentStep(step);
                  } else if (validateStep(currentStep)) {
                    setCurrentStep(step);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted &&
                    "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                  !isCurrent &&
                    !isCompleted &&
                    "text-muted-foreground cursor-pointer hover:text-foreground/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent && "bg-primary-foreground text-primary",
                    isCompleted && "bg-primary text-primary-foreground",
                    !isCurrent &&
                      !isCompleted &&
                      "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Step 1: 기본 정보 ────────────────────────────────────

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>섹션의 기본 정보를 입력합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              섹션 유형 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={sectionType}
              onValueChange={(v) => {
                const hasQuestions = questionGroups.some((g) => g.questions.length > 0);
                if (hasQuestions && v !== sectionType) {
                  toast.warning("섹션 유형을 변경하면 추가된 문제 목록이 초기화됩니다. 계속하시겠습니까?", {
                    actionButtonStyle: { backgroundColor: "hsl(0 84% 60%)", color: "white" },
                    action: {
                      label: "변경",
                      onClick: () => {
                        setSectionType(v);
                        setContentBlocks([]);
                        setQuestionGroups([]);
                      },
                    },
                    cancel: { label: "취소", onClick: () => {} },
                  });
                } else {
                  setSectionType(v);
                  setContentBlocks([]);
                  setQuestionGroups([]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              섹션명 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: Reading Passage 1 - Glass History"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>설명</Label>
            <RichTextEditor
              placeholder="섹션에 대한 설명을 입력하세요..."
              value={description}
              onChange={setDescription}
              minHeight="80px"
            />
          </div>

          <div className="space-y-2">
            <Label>제한 시간 (분)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="예: 20"
              maxLength={3}
              value={timeLimit}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^[1-9]\d{0,2}$/.test(v)) {
                  setTimeLimit(v);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Right: 연습 섹션 + 안내 페이지 */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>연습 섹션</Label>
                <p className="text-xs text-muted-foreground">
                  연습용 섹션으로 표시됩니다.
                </p>
              </div>
              <Switch checked={isPractice} onCheckedChange={setIsPractice} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>안내 페이지</CardTitle>
            <CardDescription>
              섹션 시작 전 표시될 안내 내용입니다. (선택)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>안내 페이지 제목</Label>
              <Input
                placeholder="예: Reading Test Instructions"
                value={instructionTitle}
                onChange={(e) => setInstructionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>안내 페이지 내용</Label>
              <RichTextEditor
                placeholder="시험 시작 전 표시될 안내 내용..."
                value={instructionHtml}
                onChange={setInstructionHtml}
                minHeight="120px"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ─── Step 2 state ─────────────────────────────────────────────
  const [addDrawerGroupId, setAddDrawerGroupId] = useState<string | null>(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 부모 패널(문제 추가 드로어) 닫히면 자식 패널(문제 생성)도 연쇄 닫기
  useEffect(() => {
    if (!addDrawerGroupId) {
      setShowCreateQuestion(false);
    }
  }, [addDrawerGroupId]);

  const toggleBlockCollapse = (blockId: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
      return next;
    });
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // Auto-expand newly added groups
  useEffect(() => {
    if (activeGroupId && !expandedGroups.has(activeGroupId)) {
      setExpandedGroups((prev) => new Set(prev).add(activeGroupId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  // ─── Step 2: 섹션 구성 (2-column layout matching edit page) ──

  const renderStep2 = () => {
    const needsContent = sectionType === "reading" || sectionType === "listening";

    return (
      <div className="space-y-4">
        <div className={cn("grid gap-6", needsContent ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
          {/* ─── Left Column: Content Blocks (reading/listening only) ─── */}
          {needsContent && (
          <div className="space-y-6">
            {needsContent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sectionType === "reading" ? (
                        <FileText className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Headphones className="h-5 w-5 text-sky-500" />
                      )}
                      <div>
                        <CardTitle>콘텐츠 블록 ({contentBlocks.length})</CardTitle>
                        <CardDescription>
                          여러 콘텐츠를 추가하여 문제 그룹별로 연결합니다.
                        </CardDescription>
                      </div>
                    </div>
                    <Button size="sm" onClick={addContentBlock}>
                      <Plus className="mr-1 h-4 w-4" />
                      {sectionType === "reading" ? "지문 추가" : "오디오 추가"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contentBlocks.length > 0 ? (
                    <div className="space-y-3">
                      {contentBlocks.map((block, idx) => {
                        const isCollapsed = collapsedBlocks.has(block.id);
                        const label =
                          block.content_type === "passage"
                            ? block.passage_title || `Passage ${idx + 1}`
                            : block.passage_title || `Audio ${idx + 1}`;

                        return (
                          <div key={block.id} className="border rounded-lg bg-white">
                            <div className="flex items-center gap-2 p-3 border-b">
                              <button type="button" onClick={() => toggleBlockCollapse(block.id)} className="p-0.5">
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              {block.content_type === "passage" ? (
                                <FileText className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Headphones className="h-4 w-4 text-sky-500" />
                              )}
                              <span className="text-sm font-medium flex-1">{label}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeContentBlock(block.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {!isCollapsed && (
                              <div className="p-4 space-y-3">
                                {block.content_type === "passage" ? (
                                  <>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">지문 제목</Label>
                                      <Input
                                        placeholder="예: The History of Glass"
                                        value={block.passage_title}
                                        onChange={(e) =>
                                          updateContentBlock(block.id, {
                                            passage_title: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">지문 내용</Label>
                                      <RichTextEditor
                                        placeholder="지문 내용을 입력하세요..."
                                        minHeight="200px"
                                        value={block.passage_content}
                                        onChange={(val) =>
                                          updateContentBlock(block.id, {
                                            passage_content: val,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">각주 (선택)</Label>
                                      <RichTextEditor
                                        placeholder="예: *calorie: a measure of the energy value of food"
                                        minHeight="80px"
                                        value={block.passage_footnotes}
                                        onChange={(val) =>
                                          updateContentBlock(block.id, {
                                            passage_footnotes: val,
                                          })
                                        }
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">오디오 파일</Label>
                                      <FileUpload
                                        value={block.audio_url}
                                        onChange={(url) =>
                                          updateContentBlock(block.id, {
                                            audio_url: url,
                                          })
                                        }
                                        accept="audio"
                                        placeholder="오디오 파일 업로드"
                                        deferred
                                        onFileReady={(file) =>
                                          updateContentBlock(block.id, {
                                            audioFile: file,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">지문 제목</Label>
                                      <Input
                                        placeholder="예: The History of Glass"
                                        value={block.passage_title}
                                        onChange={(e) =>
                                          updateContentBlock(block.id, {
                                            passage_title: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">지문 내용</Label>
                                      <RichTextEditor
                                        placeholder="지문 내용을 입력하세요..."
                                        minHeight="200px"
                                        value={block.passage_content}
                                        onChange={(val) =>
                                          updateContentBlock(block.id, {
                                            passage_content: val,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">각주 (선택)</Label>
                                      <RichTextEditor
                                        placeholder="예: *calorie: a measure of the energy value of food"
                                        minHeight="80px"
                                        value={block.passage_footnotes}
                                        onChange={(val) =>
                                          updateContentBlock(block.id, {
                                            passage_footnotes: val,
                                          })
                                        }
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      콘텐츠 블록이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
          )}

          {/* ─── Right Column: Question Groups (full width when no content blocks) ─── */}
          <div className="space-y-6">
            {/* Question Groups */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      문제 그룹{" "}
                      <span className="text-muted-foreground font-normal text-sm">
                        ({questionGroups.length}그룹, {totalItemCount}문항)
                      </span>
                    </CardTitle>
                    <CardDescription>
                      그룹별로 문제를 구성합니다.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={addSet}>
                    <FolderPlus className="mr-1 h-4 w-4" />
                    세트 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {questionGroups.length > 0 ? (
                  <div className="space-y-3">
                    {questionGroups.map((group, idx) => {
                      const isActive = activeGroupId === group.id;
                      const isExpanded = expandedGroups.has(group.id);
                      const autoTitle = generateGroupTitle(group);
                      const gNum = groupNumbering[group.id];

                      return (
                        <div
                          key={group.id}
                          className={cn(
                            "border rounded-lg transition-colors",
                            isActive ? "border-primary shadow-sm" : "border-border"
                          )}
                          onClick={() => setActiveGroupId(group.id)}
                        >
                          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-t-lg">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupExpand(group.id);
                              }}
                              className="p-0.5"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            <span className="text-sm font-semibold flex-1">
                              {autoTitle || `Set ${idx + 1}`}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {group.questions.length}문제
                            </Badge>
                            <Button
                              variant={addDrawerGroupId === group.id ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddDrawerGroupId(addDrawerGroupId === group.id ? null : group.id);
                                setActiveGroupId(group.id);
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              문제 추가
                            </Button>
                            {questionGroups.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSet(group.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                              {/* Content block selector (reading/listening only) */}
                              {needsContent && contentBlocks.length > 0 && (
                                <div className="space-y-1">
                                  <Label className="text-xs">콘텐츠 블록</Label>
                                  <Select
                                    value={group.content_block_id || "none"}
                                    onValueChange={(v) =>
                                      updateQuestionGroup(group.id, {
                                        content_block_id: v === "none" ? null : v,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="콘텐츠 선택..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">없음</SelectItem>
                                      {contentBlocks.map((b, bi) => (
                                        <SelectItem key={b.id} value={b.id}>
                                          {b.content_type === "passage"
                                            ? b.passage_title || `Passage ${bi + 1}`
                                            : `Audio ${bi + 1}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {/* Group title */}
                              <div className="space-y-1">
                                <Label className="text-xs">그룹 제목 (자동 생성 — 직접 입력 시 오버라이드, 예: &quot;Questions 1–5&quot;)</Label>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={autoTitle || "문제 추가 시 자동 생성"}
                                  value={group.title}
                                  onChange={(e) =>
                                    updateQuestionGroup(group.id, { title: e.target.value })
                                  }
                                />
                              </div>

                              {/* Instructions */}
                              <div className="space-y-1">
                                <Label className="text-xs">지시문</Label>
                                <RichTextEditor
                                  placeholder="예: Choose the correct letter A, B, C or D."
                                  minHeight="80px"
                                  value={group.instructions}
                                  onChange={(val) =>
                                    updateQuestionGroup(group.id, {
                                      instructions: val,
                                    })
                                  }
                                />
                              </div>

                              {/* Items */}
                              {group.questions.length > 0 ? (
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleItemDragEnd(group.id)}
                                >
                                  <SortableContext
                                    items={group.questions}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-1">
                                      {group.questions.map((qId) => {
                                        const q = availableQuestions.find(
                                          (aq) => aq.id === qId
                                        );
                                        if (!q) return null;
                                        const numInfo = numberingMap[qId];
                                        return (
                                          <SortableQuestionInGroup
                                            key={qId}
                                            id={qId}
                                            numberLabel={numInfo?.label || "—"}
                                            question={q}
                                            onRemove={() =>
                                              removeQuestionFromGroup(group.id, qId)
                                            }
                                          />
                                        );
                                      })}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground text-xs border border-dashed rounded">
                                  위 &quot;문제 추가&quot; 버튼을 클릭하여 문제를 추가하세요.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderPlus className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">세트가 없습니다.</p>
                    <Button size="sm" onClick={addSet} className="mt-3">
                      <Plus className="mr-1 h-4 w-4" />
                      첫 번째 세트 추가
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Question Add Drawer */}
        <div
          className={cn(
            "fixed left-0 top-0 h-full w-[420px] bg-white border-r shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out",
            addDrawerGroupId ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div>
              <h3 className="text-sm font-semibold">문제 추가</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} 유형
                {isPractice ? " (연습문제만)" : " (실전문제만)"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setAddDrawerGroupId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="문제 코드, 제목, 내용으로 검색..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {isLoadingQuestions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableQuestions.length > 0 ? (
              availableQuestions.map((q) => {
                const isUsed = allUsedQuestionIds.has(q.id);
                const isChecked = selectedForAdd.includes(q.id);
                const isQExpanded = expandedQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "transition-colors",
                      isUsed && "opacity-40 bg-muted/30",
                      isChecked && !isUsed && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2 p-2.5">
                      <Checkbox
                        checked={isChecked}
                        disabled={isUsed}
                        onCheckedChange={() => {
                          if (isUsed) return;
                          setSelectedForAdd((prev) =>
                            prev.includes(q.id)
                              ? prev.filter((xid) => xid !== q.id)
                              : [...prev, q.id]
                          );
                        }}
                      />
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                        onClick={() => setExpandedQuestionId(isQExpanded ? null : q.id)}
                      >
                        <span className="text-xs font-mono text-muted-foreground shrink-0">{q.question_code}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {formatLabels[q.question_format] || q.question_format}
                        </Badge>
                        <span className="text-xs text-muted-foreground shrink-0">{q.item_count}문항</span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">
                          {stripHtml(q.title || q.content)}
                        </span>
                        {isQExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {isUsed && (
                        <Badge variant="secondary" className="text-[9px] shrink-0">추가됨</Badge>
                      )}
                    </div>
                    {isQExpanded && (
                      <div className="px-2.5 pb-2.5">
                        <QuestionDetailPreview question={q} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                추가 가능한 문제가 없습니다.
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-muted/20 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{availableQuestions.length}개 사용 가능</p>
              {selectedForAdd.length > 0 && addDrawerGroupId && (
                <Button
                  size="sm"
                  onClick={() => {
                    addQuestionsToGroup(addDrawerGroupId);
                    setAddDrawerGroupId(null);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {selectedForAdd.length}개 추가
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCreateQuestion(prev => !prev)}
            >
              <Plus className="mr-1 h-4 w-4" />
              새 문제 만들기
            </Button>
          </div>
        </div>

        {/* Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              생성 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">섹션 유형</p>
                {sectionType ? (
                  <Badge className={typeColors[sectionType] || "bg-gray-100"}>
                    {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">세트 수</p>
                <p className="text-sm font-medium">{questionGroups.length}개</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">총 문제 수</p>
                <p className="text-sm font-medium">
                  {allUsedQuestionIds.size}개
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">총 문항 수</p>
                <p className="text-sm font-medium">{totalItemCount}개</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── Bottom Navigation ─────────────────────────────────────

  const renderStepNav = () => (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
      <Button
        variant="outline"
        onClick={handlePrev}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        이전
      </Button>

      <div className="text-sm text-muted-foreground font-medium">
        {currentStep} / {TOTAL_STEPS}
      </div>

      {currentStep < TOTAL_STEPS ? (
        <Button onClick={handleNext}>
          다음
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
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
      )}
    </div>
  );

  // Build preview props
  const previewContentBlocks = contentBlocks.map((b) => ({
    id: b.id,
    content_type: b.content_type,
    passage_title: b.passage_title,
    passage_content: b.passage_content,
    passage_footnotes: b.passage_footnotes,
    audio_url: b.audio_url,
  }));

  const previewQuestionGroupsData = questionGroups.map((g) => {
    const gNum = groupNumbering[g.id] || { startNum: 0, endNum: 0 };
    return {
      id: g.id,
      title: g.title,
      instructions: g.instructions || null,
      contentBlockId: g.content_block_id,
      startNum: gNum.startNum,
      endNum: gNum.endNum,
      questionIds: g.questions,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="섹션 생성"
        description="문제들을 조합하여 새로운 섹션을 생성합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/sections">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={openPreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              미리보기
            </Button>
          </div>
        }
      />

      {renderStepIndicator()}
      {renderStepNav()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}

      <SectionPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        sectionType={sectionType}
        title={title}
        timeLimit={timeLimit}
        isPractice={isPractice}
        instructionTitle={instructionTitle}
        instructionHtml={instructionHtml}
        contentBlocks={previewContentBlocks}
        questionGroups={previewQuestionGroupsData}
        questions={previewQuestions}
      />

      {/* 문제 생성 모달 */}
      {sectionType && (
        <CreateQuestionModal
          open={showCreateQuestion}
          onOpenChange={setShowCreateQuestion}
          sectionType={sectionType}
          onCreated={handleQuestionCreated}
        />
      )}
    </div>
  );
}

