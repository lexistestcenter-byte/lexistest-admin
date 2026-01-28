"use client";

import { useState, useEffect, use } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import {
  QuestionType,
  QuestionFormat,
  questionFormats,
  Blank,
  MCQOption,
  HeadingItem,
  FlowchartNode,
} from "@/components/questions/types";

// =============================================================================
// question_type 별 정보
// =============================================================================
const questionTypeInfo = [
  {
    id: "listening" as QuestionType,
    name: "Listening",
    nameKo: "듣기",
    icon: Headphones,
    color: "bg-sky-50 text-sky-600 border-sky-200",
  },
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
  fill_blank_typing: Type,
  fill_blank_drag: GripVertical,
  heading_matching: ListOrdered,
  mcq: CheckCircle2,
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

  // 제목 매칭
  const [sections, setSections] = useState<{ number: number; preview: string }[]>([]);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  // 4지선다
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([
    { id: "a", label: "A", text: "", isCorrect: false },
    { id: "b", label: "B", text: "", isCorrect: false },
    { id: "c", label: "C", text: "", isCorrect: false },
    { id: "d", label: "D", text: "", isCorrect: false },
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
          if (format === "fill_blank_drag" && optionsData?.word_bank) {
            setWordBank(optionsData.word_bank);
          }
        }
        // MCQ
        else if (format === "mcq") {
          setMcqQuestion(content);
          if (Array.isArray(optionsData)) {
            setMcqOptions(optionsData.map((o: { label: string; content: string; is_correct: boolean }) => ({
              id: o.label.toLowerCase(),
              label: o.label,
              text: o.content,
              isCorrect: o.is_correct,
            })));
          }
        }
        // Heading matching
        else if (format === "heading_matching") {
          try {
            const parsed = JSON.parse(content);
            setSections(parsed.sections || []);
            setHeadings((parsed.headings || []).map((h: { id: string; text: string; matchedSection?: number | null }) => ({
              id: h.id,
              text: h.text,
              matchedSection: null,
            })));
            // 정답 매핑
            if (answerData?.matches) {
              const matchMap = new Map<string, number>(
                answerData.matches.map((m: { heading_id: string; section: number }) => [m.heading_id, m.section])
              );
              setHeadings((prev) => prev.map((h) => ({
                ...h,
                matchedSection: matchMap.get(h.id) ?? null,
              })));
            }
          } catch {
            console.error("Failed to parse heading matching content");
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
  // 제목 매칭 관련 함수
  // ==========================================================================
  const addSection = () => {
    const nextNum = sections.length > 0 ? Math.max(...sections.map(s => s.number)) + 1 : 1;
    setSections([...sections, { number: nextNum, preview: "" }]);
  };

  const addHeading = () => {
    setHeadings([...headings, { id: `h${Date.now()}`, text: "", matchedSection: null }]);
  };

  // ==========================================================================
  // MCQ 관련 함수
  // ==========================================================================
  const updateMcqOption = (id: string, field: keyof MCQOption, value: unknown) => {
    setMcqOptions(mcqOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const selectCorrectAnswer = (correctId: string) => {
    setMcqOptions(mcqOptions.map(o => ({ ...o, isCorrect: o.id === correctId })));
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
        toast.error("4지선다 선택지를 모두 입력해주세요.");
        return;
      }
      const hasCorrect = mcqOptions.some(o => o.isCorrect);
      if (!hasCorrect) {
        toast.error("4지선다 정답을 선택해주세요.");
        return;
      }
      if (!mcqQuestion.trim()) {
        toast.error("4지선다 문제를 입력해주세요.");
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
        if (selectedFormat === "fill_blank_drag") {
          optionsData = { word_bank: wordBank };
        }
      }
      // MCQ
      else if (selectedFormat === "mcq") {
        content = mcqQuestion;
        optionsData = mcqOptions.map(o => ({
          label: o.label,
          content: o.text,
          is_correct: o.isCorrect,
        }));
        const correctOption = mcqOptions.find(o => o.isCorrect);
        answerData = { correct: correctOption?.label || "" };
      }
      // Heading matching
      else if (selectedFormat === "heading_matching") {
        content = JSON.stringify({ sections, headings });
        answerData = {
          matches: headings
            .filter(h => h.matchedSection !== null)
            .map(h => ({ heading_id: h.id, section: h.matchedSection })),
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
        question_format: selectedFormat,
        content,
        title: contentTitle || flowchartTitle || null,
        instructions: instructions || null,
        options_data: optionsData,
        answer_data: answerData,
        model_answers: modelAnswers,
        generate_followup: generateFollowup,
        tags: tags ? tags.split(",").map(t => t.trim()) : null,
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
                  <p className="text-xs text-muted-foreground">
                    생성 후 변경 불가
                  </p>
                </div>
                <Switch
                  checked={isPractice}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">태그</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="쉼표로 구분"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            {/* 지시문 (Reading/Listening만) */}
            {(selectedQuestionType === "reading" || selectedQuestionType === "listening") && (
              <div className="space-y-2">
                <Label className="text-xs">지시문 (Instructions)</Label>
                <Textarea
                  className="text-sm resize-none"
                  rows={3}
                  placeholder="예: Write ONE WORD from the text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            )}

            {/* 유형별 추가 설정 */}
            {selectedFormat === "fill_blank_drag" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">단어 목록 (Word Bank)</Label>
                  <Button variant="ghost" size="sm" onClick={addWord} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    추가
                  </Button>
                </div>
                <div className="space-y-2">
                  {wordBank.map((word, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="h-8 text-sm"
                        value={word}
                        onChange={(e) => updateWord(i, e.target.value)}
                        placeholder={`단어 ${i + 1}`}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeWord(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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
            {/* 빈칸채우기 */}
            {(selectedFormat === "fill_blank_typing" || selectedFormat === "fill_blank_drag") && (
              <FillBlankEditor
                title={contentTitle}
                setTitle={setContentTitle}
                content={contentHtml}
                setContent={setContentHtml}
                blanks={blanks}
                addBlank={addBlank}
                updateBlank={updateBlank}
                removeBlank={removeBlank}
              />
            )}

            {/* 제목 매칭 */}
            {selectedFormat === "heading_matching" && (
              <HeadingMatchingEditor
                sections={sections}
                setSections={setSections}
                addSection={addSection}
                headings={headings}
                setHeadings={setHeadings}
                addHeading={addHeading}
              />
            )}

            {/* 4지선다 */}
            {selectedFormat === "mcq" && (
              <MCQEditor
                question={mcqQuestion}
                setQuestion={setMcqQuestion}
                options={mcqOptions}
                updateOption={updateMcqOption}
                selectCorrect={selectCorrectAnswer}
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
        sections={sections}
        headings={headings}
        mcqQuestion={mcqQuestion}
        mcqOptions={mcqOptions}
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
  title, setTitle, content, setContent, blanks, addBlank, updateBlank, removeBlank
}: {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  blanks: Blank[];
  addBlank: () => void;
  updateBlank: (id: string, field: keyof Blank, value: unknown) => void;
  removeBlank: (id: string) => void;
}) {
  const [expandedBlank, setExpandedBlank] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>제목</Label>
        <Input
          placeholder="예: Marie Curie's research on radioactivity"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-medium"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <RequiredLabel required>내용</RequiredLabel>
          <p className="text-xs text-muted-foreground">
            빈칸 위치: <code className="bg-slate-100 px-1 rounded">{`[12]`}</code> 형식으로 입력
          </p>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="font-mono text-sm leading-relaxed"
        />
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
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">빈칸 정답을 추가하세요</p>
            </div>
          ) : (
            blanks.map((blank) => (
              <div key={blank.id} className="p-3 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-16">
                    <Input
                      type="number"
                      value={blank.number}
                      onChange={(e) => updateBlank(blank.id, "number", parseInt(e.target.value) || 0)}
                      className="h-9 text-center font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={blank.answer}
                      onChange={(e) => updateBlank(blank.id, "answer", e.target.value)}
                      placeholder="정답"
                      className="h-9"
                    />
                  </div>
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
                        onClick={() => {
                          const alts = blank.alternatives || [];
                          updateBlank(blank.id, "alternatives", [...alts, ""]);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    </div>
                    {(blank.alternatives || []).map((alt, altIndex) => (
                      <div key={altIndex} className="flex items-center gap-2">
                        <Input
                          value={alt}
                          onChange={(e) => {
                            const alts = [...(blank.alternatives || [])];
                            alts[altIndex] = e.target.value;
                            updateBlank(blank.id, "alternatives", alts);
                          }}
                          placeholder={`대체 정답 ${altIndex + 1}`}
                          className="h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const alts = (blank.alternatives || []).filter((_, i) => i !== altIndex);
                            updateBlank(blank.id, "alternatives", alts);
                          }}
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
// 제목 매칭 에디터
// =============================================================================
function HeadingMatchingEditor({
  sections, setSections, addSection, headings, setHeadings, addHeading
}: {
  sections: { number: number; preview: string }[];
  setSections: (v: { number: number; preview: string }[]) => void;
  addSection: () => void;
  headings: HeadingItem[];
  setHeadings: (v: HeadingItem[]) => void;
  addHeading: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">List of Headings</Label>
          <Button variant="outline" size="sm" onClick={addHeading}>
            <Plus className="mr-2 h-4 w-4" />
            제목 추가
          </Button>
        </div>
        <div className="space-y-2">
          {headings.map((heading, index) => (
            <div key={heading.id} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
              <span className="text-sm text-muted-foreground w-8">{String.fromCharCode(105 + index)}.</span>
              <Input
                value={heading.text}
                onChange={(e) => setHeadings(headings.map(h => h.id === heading.id ? { ...h, text: e.target.value } : h))}
                placeholder="제목 내용"
                className="flex-1"
              />
              <Select
                value={heading.matchedSection?.toString() || "distractor"}
                onValueChange={(v) => setHeadings(headings.map(h => h.id === heading.id ? { ...h, matchedSection: v === "distractor" ? null : parseInt(v) } : h))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distractor">오답 (Distractor)</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s.number} value={s.number.toString()}>
                      정답: {s.number}번
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {headings.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => setHeadings(headings.filter(h => h.id !== heading.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">문제 섹션</Label>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            섹션 추가
          </Button>
        </div>
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={section.number}
                  onChange={(e) => setSections(sections.map((s, i) => i === index ? { ...s, number: parseInt(e.target.value) || 0 } : s))}
                  className="w-20 text-center font-mono"
                />
                <span className="text-sm text-muted-foreground">← 문제 번호</span>
              </div>
              <Textarea
                value={section.preview}
                onChange={(e) => setSections(sections.map((s, i) => i === index ? { ...s, preview: e.target.value } : s))}
                placeholder="섹션 내용 미리보기"
                rows={3}
                className="text-sm"
              />
              {sections.length > 2 && (
                <Button variant="ghost" size="sm" onClick={() => setSections(sections.filter((_, i) => i !== index))} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  섹션 삭제
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
// 4지선다 에디터
// =============================================================================
function MCQEditor({
  question, setQuestion, options, updateOption, selectCorrect
}: {
  question: string;
  setQuestion: (v: string) => void;
  options: MCQOption[];
  updateOption: (id: string, field: keyof MCQOption, value: unknown) => void;
  selectCorrect: (id: string) => void;
}) {
  // 허용된 특수문자만 필터링 (영문, 숫자, 한글, 공백, 기본 특수문자)
  const sanitizeText = (text: string) => {
    return text.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?'"\-():;]/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <RequiredLabel required>문제</RequiredLabel>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: In paragraph one, the writer suggests that companies could consider"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <RequiredLabel required>선택지 (4개 모두 필수)</RequiredLabel>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium cursor-pointer transition-all ${
                option.isCorrect
                  ? "border-green-500 bg-green-500 text-white ring-2 ring-green-200"
                  : "border-slate-300 hover:border-primary hover:bg-primary/10"
              }`}
              onClick={() => selectCorrect(option.id)}
            >
              {option.label}
            </div>
            <Input
              value={option.text}
              onChange={(e) => updateOption(option.id, "text", sanitizeText(e.target.value))}
              placeholder={`선택지 ${option.label} (필수)`}
              className="flex-1"
            />
            {option.isCorrect && (
              <span className="text-xs text-green-600 font-medium">정답</span>
            )}
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          원형 버튼을 클릭하여 정답을 선택하세요. 허용 특수문자: . ! ? &apos; &quot; , - ( ) : ;
        </p>
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
  title,
  content,
  blanks,
  wordBank,
}: {
  title: string;
  content: string;
  blanks: Blank[];
  wordBank: string[];
}) {
  const [placedWords, setPlacedWords] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  const availableWords = wordBank.filter(w => w && !Object.values(placedWords).includes(w));

  const handleDragStart = (word: string) => {
    setDraggedWord(word);
  };

  const handleDragEnd = () => {
    setDraggedWord(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (blankNumber: number) => {
    if (draggedWord) {
      setPlacedWords(prev => ({ ...prev, [blankNumber]: draggedWord }));
      setDraggedWord(null);
    }
  };

  const handleDoubleClick = (blankNumber: number) => {
    setPlacedWords(prev => {
      const newPlaced = { ...prev };
      delete newPlaced[blankNumber];
      return newPlaced;
    });
  };

  const renderContent = () => {
    if (!content) return null;

    const parts = content.split(/\[(\d+)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const num = parseInt(part);
        const placedWord = placedWords[num];

        return (
          <span key={index} className="inline-flex items-center mx-1">
            <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center shrink-0">
              {num}
            </span>
            <span
              className={`min-w-[100px] h-8 mx-1 px-2 flex items-center border-2 rounded transition-colors ${
                placedWord
                  ? "bg-green-100 border-green-400 cursor-pointer"
                  : draggedWord
                  ? "border-dashed border-primary bg-primary/10"
                  : "border-dashed border-slate-400"
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(num)}
              onDoubleClick={() => placedWord && handleDoubleClick(num)}
              title={placedWord ? "더블클릭하여 제거" : "단어를 여기에 드롭하세요"}
            >
              {placedWord || ""}
            </span>
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

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {title && (
        <h2 className="text-lg font-bold border-b pb-3">{title}</h2>
      )}
      <div className="leading-relaxed whitespace-pre-wrap">
        {renderContent()}
      </div>
      <div className="pt-4 border-t mt-6">
        <p className="text-sm text-muted-foreground mb-2">Word Bank (드래그하여 빈칸에 놓으세요)</p>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word, i) => (
            <span
              key={`${word}-${i}`}
              draggable
              onDragStart={() => handleDragStart(word)}
              onDragEnd={handleDragEnd}
              className={`px-3 py-1.5 bg-slate-100 rounded border cursor-grab hover:bg-slate-200 select-none transition-transform ${
                draggedWord === word ? "opacity-50 scale-95" : ""
              }`}
            >
              {word}
            </span>
          ))}
          {availableWords.length === 0 && (
            <span className="text-sm text-muted-foreground">모든 단어가 사용되었습니다</span>
          )}
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
  sections, headings, mcqQuestion, mcqOptions,
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
  sections: { number: number; preview: string }[];
  headings: HeadingItem[];
  mcqQuestion: string;
  mcqOptions: MCQOption[];
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
      <DialogContent className="max-w-[1100px] w-[95vw] max-h-[85vh] p-0 gap-0 flex flex-col">
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
                  {renderContent(contentHtml)}
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

            {/* 제목 매칭 */}
            {format === "heading_matching" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section.number} className="bg-white rounded-lg border p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-9 border-2 border-dashed border-slate-400 rounded flex items-center justify-center font-mono font-bold">
                          {section.number}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{section.preview || "(섹션 미리보기)"}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold mb-4">List of Headings</h3>
                  <div className="space-y-2">
                    {headings.map((heading, i) => (
                      <div key={heading.id} className="p-3 bg-slate-50 rounded border-l-4 border-primary cursor-pointer hover:bg-slate-100">
                        <span className="text-muted-foreground mr-2">{String.fromCharCode(105 + i)}.</span>
                        <span className="font-medium">{heading.text || "(제목 입력)"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4지선다 */}
            {format === "mcq" && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <p className="text-lg">{mcqQuestion || "(문제 입력)"}</p>
                <div className="space-y-3 mt-4">
                  {mcqOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                        {option.label}
                      </div>
                      <span>{option.text || `(선택지 ${option.label})`}</span>
                    </label>
                  ))}
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
                        <div className="text-sm">{renderContent(node.content || "(내용 입력)")}</div>
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
