"use client";

import { useState, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
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

const formatDescriptions: Record<string, string> = {
  mcq: "단일선택(라디오) 또는 복수선택(체크박스) 객관식",
  true_false_ng: "True / False / Not Given 중 선택 (순서 고정)",
  matching: "보기를 드래그하여 문항에 매칭",
  fill_blank_typing: "학생이 텍스트를 직접 입력",
  fill_blank_drag: "주어진 단어 목록에서 드래그하여 선택",
  flowchart: "플로우차트의 빈칸을 채우는 방식",
  essay: "주어진 주제에 대해 에세이 작성",
  speaking_part1: "일상적인 주제에 대한 짧은 질문과 답변",
  speaking_part2: "큐카드를 보고 1~2분간 발표",
  speaking_part3: "Part 2 주제와 관련된 심화 토론",
};

// =============================================================================
// 탭 데이터 인터페이스
// =============================================================================
interface QuestionTab {
  id: string;
  format: QuestionFormat | null;

  // MCQ (통합: 단일/복수)
  mcqQuestion: string;
  mcqOptions: MCQOption[];
  mcqIsMultiple: boolean;
  mcqMaxSelections: number;

  // T/F/NG (단일 진술문)
  tfngStatement: string;
  tfngAnswer: "true" | "false" | "not_given";

  // Matching
  matchingTitle: string;
  matchingAllowDuplicate: boolean;
  matchingOptions: MatchingOption[];
  matchingItems: MatchingItem[];

  // Fill blank
  contentTitle: string;
  contentHtml: string;
  blanks: Blank[];
  wordBank: string[];

  // Flowchart
  flowchartTitle: string;
  flowchartNodes: FlowchartNode[];
  flowchartBlanks: Blank[];

  // Writing
  writingTitle: string;
  writingCondition: string;
  writingPrompt: string;
  writingImageUrl: string;

  // Speaking
  speakingQuestion: string;
  cueCardTopic: string;
  cueCardPoints: string[];
  generateFollowup: boolean;

  // Common (MCQ 제외한 유형에만 사용)
  instructions: string;
  tags: string;
  isPractice: boolean;

  // Validation
  hasError: boolean;
  errorMessage: string;
}

// 기본 탭 생성 함수
const createDefaultTab = (): QuestionTab => ({
  id: `tab-${Date.now()}`,
  format: null,

  mcqQuestion: "",
  mcqOptions: [
    { id: "a", label: "A", text: "", isCorrect: false },
    { id: "b", label: "B", text: "", isCorrect: false },
    { id: "c", label: "C", text: "", isCorrect: false },
    { id: "d", label: "D", text: "", isCorrect: false },
  ],
  mcqIsMultiple: false,
  mcqMaxSelections: 2,

  tfngStatement: "",
  tfngAnswer: "true",

  matchingTitle: "",
  matchingAllowDuplicate: false,
  matchingOptions: [
    { id: "o1", label: "A", text: "" },
    { id: "o2", label: "B", text: "" },
  ],
  matchingItems: [{ id: "m1", number: 1, statement: "", correctLabel: "" }],

  contentTitle: "",
  contentHtml: "",
  blanks: [],
  wordBank: [],

  flowchartTitle: "",
  flowchartNodes: [{ id: "n1", type: "box", content: "", row: 0, col: 0 }],
  flowchartBlanks: [],

  writingTitle: "",
  writingCondition: "",
  writingPrompt: "",
  writingImageUrl: "",

  speakingQuestion: "",
  cueCardTopic: "",
  cueCardPoints: ["", "", "", ""],
  generateFollowup: false,

  instructions: "",
  tags: "",
  isPractice: false,

  hasError: false,
  errorMessage: "",
});

// =============================================================================
// 메인 컴포넌트
// =============================================================================
export default function NewQuestionPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // 문제 유형 (최초 선택 후 고정)
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);

  // 탭 관리
  const [tabs, setTabs] = useState<QuestionTab[]>([createDefaultTab()]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // 미리보기 모달
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 현재 활성 탭
  const currentTab = tabs[activeTabIndex];

  // ==========================================================================
  // 탭 업데이트 헬퍼
  // ==========================================================================
  const updateCurrentTab = useCallback(<K extends keyof QuestionTab>(
    field: K,
    value: QuestionTab[K]
  ) => {
    setTabs(prevTabs => prevTabs.map((tab, idx) =>
      idx === activeTabIndex ? { ...tab, [field]: value, hasError: false, errorMessage: "" } : tab
    ));
  }, [activeTabIndex]);

  // ==========================================================================
  // 탭 관리 함수
  // ==========================================================================
  const addTab = () => {
    const newTab = createDefaultTab();
    setTabs([...tabs, newTab]);
    setActiveTabIndex(tabs.length);
  };

  const removeTab = (index: number) => {
    if (tabs.length <= 1) {
      toast.error("최소 1개의 탭이 필요합니다.");
      return;
    }
    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(newTabs.length - 1);
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  // ==========================================================================
  // MCQ 관련 함수
  // ==========================================================================
  const addMcqOption = () => {
    const labels = "ABCDEFGHIJ";
    const options = currentTab.mcqOptions;
    const nextLabel = labels[options.length] || `O${options.length + 1}`;
    updateCurrentTab("mcqOptions", [...options, { id: `o${Date.now()}`, label: nextLabel, text: "", isCorrect: false }]);
  };

  const removeMcqOption = (id: string) => {
    const options = currentTab.mcqOptions;
    if (options.length <= 2) {
      toast.error("최소 2개의 선택지가 필요합니다.");
      return;
    }
    const newOptions = options.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    updateCurrentTab("mcqOptions", newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
    // 정답 개수가 선택지 개수를 초과하면 조정
    if (currentTab.mcqMaxSelections > newOptions.length) {
      updateCurrentTab("mcqMaxSelections", Math.max(2, newOptions.length));
    }
  };

  const updateMcqOption = (id: string, field: keyof MCQOption, value: unknown) => {
    updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const toggleMcqCorrect = (id: string) => {
    if (currentTab.mcqIsMultiple) {
      updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => o.id === id ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => ({ ...o, isCorrect: o.id === id })));
    }
  };

  // MCQ 모드 전환 시 정답 초기화
  const toggleMcqMode = (isMultiple: boolean) => {
    updateCurrentTab("mcqIsMultiple", isMultiple);
    // 정답 초기화
    updateCurrentTab("mcqOptions", currentTab.mcqOptions.map(o => ({ ...o, isCorrect: false })));
  };

  // ==========================================================================
  // 매칭 관련 함수
  // ==========================================================================
  const addMatchingOption = () => {
    const options = currentTab.matchingOptions;
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[options.length] || `O${options.length + 1}`;
    updateCurrentTab("matchingOptions", [...options, { id: `o${Date.now()}`, label: nextLabel, text: "" }]);
  };

  const removeMatchingOption = (id: string) => {
    const options = currentTab.matchingOptions;
    if (options.length <= 2) {
      toast.error("최소 2개의 보기가 필요합니다.");
      return;
    }
    const newOptions = options.filter(o => o.id !== id);
    const labels = "ABCDEFGHIJ";
    updateCurrentTab("matchingOptions", newOptions.map((o, i) => ({ ...o, label: labels[i] || `O${i + 1}` })));
  };

  const updateMatchingOption = (id: string, text: string) => {
    updateCurrentTab("matchingOptions", currentTab.matchingOptions.map(o => o.id === id ? { ...o, text } : o));
  };

  const addMatchingItem = () => {
    const items = currentTab.matchingItems;
    const nextNum = items.length > 0 ? Math.max(...items.map(i => i.number)) + 1 : 1;
    updateCurrentTab("matchingItems", [...items, { id: `m${Date.now()}`, number: nextNum, statement: "", correctLabel: "" }]);
  };

  const updateMatchingItem = (id: string, field: keyof MatchingItem, value: unknown) => {
    updateCurrentTab("matchingItems", currentTab.matchingItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeMatchingItem = (id: string) => {
    if (currentTab.matchingItems.length <= 1) {
      toast.error("최소 1개의 문항이 필요합니다.");
      return;
    }
    updateCurrentTab("matchingItems", currentTab.matchingItems.filter(i => i.id !== id));
  };

  // ==========================================================================
  // 빈칸 관련 함수
  // ==========================================================================
  const addBlank = () => {
    const blanks = currentTab.blanks;
    const nextNumber = blanks.length > 0 ? Math.max(...blanks.map(b => b.number)) + 1 : 1;
    updateCurrentTab("blanks", [...blanks, { id: `b${Date.now()}`, number: nextNumber, answer: "", alternatives: [] }]);
  };

  const updateBlank = (id: string, field: keyof Blank, value: unknown) => {
    updateCurrentTab("blanks", currentTab.blanks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlank = (id: string) => {
    updateCurrentTab("blanks", currentTab.blanks.filter(b => b.id !== id));
  };

  // Word Bank
  const addWord = () => updateCurrentTab("wordBank", [...currentTab.wordBank, ""]);
  const updateWord = (index: number, value: string) => {
    const newBank = [...currentTab.wordBank];
    newBank[index] = value;
    updateCurrentTab("wordBank", newBank);
  };
  const removeWord = (index: number) => updateCurrentTab("wordBank", currentTab.wordBank.filter((_, i) => i !== index));

  // ==========================================================================
  // 플로우차트 관련 함수
  // ==========================================================================
  const addFlowchartNode = (type: "box" | "branch") => {
    const nodes = currentTab.flowchartNodes;
    const maxRow = nodes.reduce((max, n) => Math.max(max, n.row), -1);
    updateCurrentTab("flowchartNodes", [...nodes, {
      id: `n${Date.now()}`,
      type,
      content: "",
      row: maxRow + 1,
      col: 0,
      label: type === "branch" ? "" : undefined,
    }]);
  };

  const addFlowchartBlank = () => {
    const blanks = currentTab.flowchartBlanks;
    const nextNumber = blanks.length > 0 ? Math.max(...blanks.map(b => b.number)) + 1 : 1;
    updateCurrentTab("flowchartBlanks", [...blanks, { id: `fb${Date.now()}`, number: nextNumber, answer: "", alternatives: [] }]);
  };

  // ==========================================================================
  // 유효성 검사
  // ==========================================================================
  const validateTab = (tab: QuestionTab, index: number): { valid: boolean; message: string } => {
    const format = tab.format;

    if (!format) {
      return { valid: false, message: `탭 ${index + 1}: 문제 형태를 선택하세요.` };
    }

    // MCQ 검증
    if (format === "mcq") {
      if (!tab.mcqQuestion.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 문제를 입력하세요.` };
      }
      const hasCorrect = tab.mcqOptions.some(o => o.isCorrect);
      if (!hasCorrect) {
        return { valid: false, message: `탭 ${index + 1}: 정답을 선택하세요.` };
      }
      const emptyOptions = tab.mcqOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 선택지를 입력하세요.` };
      }
      if (tab.mcqIsMultiple) {
        const correctCount = tab.mcqOptions.filter(o => o.isCorrect).length;
        if (correctCount !== tab.mcqMaxSelections) {
          return { valid: false, message: `탭 ${index + 1}: 정답 개수(${tab.mcqMaxSelections}개)에 맞게 선택하세요. (현재 ${correctCount}개)` };
        }
      }
    }

    // T/F/NG 검증
    if (format === "true_false_ng") {
      if (!tab.tfngStatement.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 진술문을 입력하세요.` };
      }
    }

    // 매칭 검증
    if (format === "matching") {
      const emptyOptions = tab.matchingOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 보기를 입력하세요.` };
      }
      const emptyItems = tab.matchingItems.filter(i => !i.statement.trim() || !i.correctLabel);
      if (emptyItems.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 문항과 정답을 입력하세요.` };
      }
    }

    // 빈칸채우기 검증
    if (format === "fill_blank_typing" || format === "fill_blank_drag") {
      if (!tab.contentHtml.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 지문을 입력하세요.` };
      }
      if (tab.blanks.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 빈칸을 추가하세요.` };
      }
      const emptyBlanks = tab.blanks.filter(b => !b.answer.trim());
      if (emptyBlanks.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 빈칸의 정답을 입력하세요.` };
      }
    }

    // 플로우차트 검증
    if (format === "flowchart") {
      if (!tab.flowchartTitle.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 플로우차트 제목을 입력하세요.` };
      }
    }

    // Writing 검증
    if (format === "essay") {
      if (!tab.writingPrompt.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 작문 프롬프트를 입력하세요.` };
      }
    }

    // Speaking 검증
    if (format === "speaking_part1" || format === "speaking_part3") {
      if (!tab.speakingQuestion.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 질문을 입력하세요.` };
      }
    }

    if (format === "speaking_part2") {
      if (!tab.cueCardTopic.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 큐카드 주제를 입력하세요.` };
      }
    }

    return { valid: true, message: "" };
  };

  // ==========================================================================
  // 저장
  // ==========================================================================
  const handleSave = async () => {
    // 모든 탭 검증
    let hasErrors = false;
    const validatedTabs = tabs.map((tab, index) => {
      const result = validateTab(tab, index);
      if (!result.valid) {
        hasErrors = true;
        return { ...tab, hasError: true, errorMessage: result.message };
      }
      return { ...tab, hasError: false, errorMessage: "" };
    });

    if (hasErrors) {
      setTabs(validatedTabs);
      const firstErrorTab = validatedTabs.findIndex(t => t.hasError);
      if (firstErrorTab !== -1) {
        setActiveTabIndex(firstErrorTab);
        toast.error(validatedTabs[firstErrorTab].errorMessage);
      }
      return;
    }

    setIsSaving(true);

    try {
      // 각 탭을 개별 문제로 저장
      const results = await Promise.all(tabs.map(async (tab) => {
        // 실제 저장 형식 결정 (MCQ의 경우)
        let actualFormat = tab.format;
        if (tab.format === "mcq") {
          actualFormat = tab.mcqIsMultiple ? "mcq_multiple" : "mcq_single";
        }

        // 데이터 구성
        let content = "";
        let optionsData: Record<string, unknown> = {};
        let answerData: Record<string, unknown> = {};

        if (tab.format === "mcq") {
          content = tab.mcqQuestion;
          optionsData = {
            isMultiple: tab.mcqIsMultiple,
            maxSelections: tab.mcqIsMultiple ? tab.mcqMaxSelections : undefined,
            options: tab.mcqOptions.map(o => ({
              label: o.label,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          };
        } else if (tab.format === "true_false_ng") {
          content = tab.tfngStatement;
          answerData = {
            answer: tab.tfngAnswer,
          };
        } else if (tab.format === "matching") {
          optionsData = {
            title: tab.matchingTitle || undefined,
            allowDuplicate: tab.matchingAllowDuplicate,
            options: tab.matchingOptions.map(o => ({
              label: o.label,
              text: o.text,
            })),
            items: tab.matchingItems.map(i => ({
              number: i.number,
              statement: i.statement,
              correctLabel: i.correctLabel,
            })),
          };
        } else if (tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag") {
          content = tab.contentHtml;
          optionsData = {
            title: tab.contentTitle || undefined,
            ...(tab.format === "fill_blank_drag" ? { word_bank: tab.wordBank } : {}),
          };
          answerData = {
            blanks: tab.blanks.map(b => ({
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives,
            })),
          };
        } else if (tab.format === "flowchart") {
          content = JSON.stringify({
            title: tab.flowchartTitle,
            nodes: tab.flowchartNodes,
          });
          answerData = {
            blanks: tab.flowchartBlanks.map(b => ({
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives,
            })),
          };
        } else if (tab.format === "essay") {
          content = tab.writingPrompt;
          optionsData = {
            title: tab.writingTitle || undefined,
            condition: tab.writingCondition || undefined,
            image_url: tab.writingImageUrl || undefined,
          };
        } else if (tab.format === "speaking_part1" || tab.format === "speaking_part3") {
          content = tab.speakingQuestion;
        } else if (tab.format === "speaking_part2") {
          content = JSON.stringify({
            topic: tab.cueCardTopic,
            points: tab.cueCardPoints.filter(p => p.trim()),
          });
          optionsData = {
            generate_followup: tab.generateFollowup,
          };
        }

        const payload = {
          question_type: selectedQuestionType,
          question_format: actualFormat,
          content,
          title: tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag"
            ? tab.contentTitle
            : tab.format === "essay"
            ? tab.writingTitle
            : undefined,
          instructions: (tab.format !== "mcq" && tab.format !== "true_false_ng") ? tab.instructions || undefined : undefined,
          options_data: Object.keys(optionsData).length > 0 ? optionsData : undefined,
          answer_data: Object.keys(answerData).length > 0 ? answerData : undefined,
          tags: (tab.format !== "mcq" && tab.format !== "true_false_ng" && tab.tags) ? tab.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
          is_practice: tab.isPractice,
          generate_followup: tab.format === "speaking_part2" ? tab.generateFollowup : undefined,
        };

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "저장 실패");
        }

        return await response.json();
      }));

      toast.success(`${results.length}개의 문제가 저장되었습니다.`);
      router.push("/questions");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // Step 1: 문제 유형 선택
  // ==========================================================================
  if (!selectedQuestionType) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/questions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">문제 유형 선택</h1>
            <p className="text-muted-foreground mt-2">
              어떤 유형의 문제를 만드시겠습니까?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {questionTypeInfo.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedQuestionType(type.id)}
                  className="flex flex-col items-center p-8 border-2 rounded-2xl bg-white hover:border-primary hover:shadow-lg transition-all group"
                >
                  <div className={`p-4 rounded-xl ${type.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <h2 className="text-xl font-bold">{type.name}</h2>
                  <p className="text-muted-foreground">{type.nameKo}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Step 2: 형태 선택 (탭에서 format이 null인 경우)
  // ==========================================================================
  if (!currentTab.format) {
    const formats = questionFormats[selectedQuestionType];
    const currentTypeInfo = questionTypeInfo.find(t => t.id === selectedQuestionType);

    return (
      <div className="min-h-screen bg-slate-50">
        {/* 헤더 */}
        <div className="border-b px-6 py-4 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => {
              if (tabs.length === 1 && !tabs[0].format) {
                setSelectedQuestionType(null);
              } else {
                removeTab(activeTabIndex);
              }
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tabs.length === 1 && !tabs[0].format ? "유형 변경" : "취소"}
            </Button>
            <div className="h-6 w-px bg-border" />
            {currentTypeInfo && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentTypeInfo.color}`}>
                {currentTypeInfo.name}
              </span>
            )}
          </div>
        </div>

        {/* 탭 바 */}
        {tabs.length > 1 && (
          <div className="border-b px-6 py-2 bg-white flex items-center gap-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabIndex(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  index === activeTabIndex
                    ? "bg-primary text-white"
                    : tab.hasError
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {tab.hasError && <AlertCircle className="h-4 w-4" />}
                문제 {index + 1}
                {tab.format && <span className="text-xs opacity-75">({formatLabels[tab.format]})</span>}
              </button>
            ))}
            <button
              onClick={addTab}
              className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 형태 선택 */}
        <div className="max-w-3xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">문제 형태 선택</h1>
            <p className="text-muted-foreground mt-1">
              {selectedQuestionType === "reading" && "Reading 문제 형태를 선택하세요"}
              {selectedQuestionType === "listening" && "Listening 문제 형태를 선택하세요"}
              {selectedQuestionType === "writing" && "Writing Task를 선택하세요"}
              {selectedQuestionType === "speaking" && "Speaking Part를 선택하세요"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formats.map((format) => {
              const Icon = formatIcons[format.value] || FileText;
              return (
                <button
                  key={format.value}
                  onClick={() => updateCurrentTab("format", format.value as QuestionFormat)}
                  className="flex items-start gap-4 p-6 border rounded-xl bg-white hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{format.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDescriptions[format.value]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Step 3: 에디터
  // ==========================================================================
  const currentTypeInfo = questionTypeInfo.find(t => t.id === selectedQuestionType);
  const formatLabel = questionFormats[selectedQuestionType].find(f => f.value === currentTab.format)?.label || currentTab.format;

  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => updateCurrentTab("format", null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            형태 변경
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            {currentTypeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentTypeInfo.color}`}>
                {currentTypeInfo.name}
              </span>
            )}
            <span className="font-medium">{formatLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            미리보기
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
                저장 ({tabs.length}개)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="border-b px-6 py-2 bg-white flex items-center gap-2">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              index === activeTabIndex
                ? "bg-primary text-white"
                : tab.hasError
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 hover:bg-slate-200"
            }`}
            onClick={() => setActiveTabIndex(index)}
          >
            {tab.hasError && <AlertCircle className="h-4 w-4" />}
            문제 {index + 1}
            {tab.format && (
              <span className="text-xs opacity-75">
                ({questionFormats[selectedQuestionType].find(f => f.value === tab.format)?.label || tab.format})
              </span>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(index);
                }}
                className="ml-1 hover:bg-white/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 설정 패널 (MCQ, T/F/NG 제외) */}
        {currentTab.format !== "mcq" && currentTab.format !== "true_false_ng" && (
          <div className="w-80 border-r bg-slate-50 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">기본 설정</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">연습 문제</Label>
                    <p className="text-xs text-muted-foreground">실전 시험이 아닌 연습용</p>
                  </div>
                  <Switch
                    checked={currentTab.isPractice}
                    onCheckedChange={(v) => updateCurrentTab("isPractice", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">태그</Label>
                  <Input
                    className="h-9 text-sm"
                    placeholder="쉼표로 구분"
                    value={currentTab.tags}
                    onChange={(e) => updateCurrentTab("tags", e.target.value)}
                  />
                </div>
              </div>

              {/* 지시문 (Reading/Listening) */}
              {(selectedQuestionType === "reading" || selectedQuestionType === "listening") && (
                <div className="space-y-2">
                  <Label className="text-xs">지시문 (Instructions)</Label>
                  <Textarea
                    className="text-sm resize-none"
                    rows={3}
                    placeholder="예: Write ONE WORD from the text"
                    value={currentTab.instructions}
                    onChange={(e) => updateCurrentTab("instructions", e.target.value)}
                  />
                </div>
              )}

              {/* Word Bank (fill_blank_drag) */}
              {currentTab.format === "fill_blank_drag" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">단어 목록 (Word Bank)</Label>
                    <Button variant="ghost" size="sm" onClick={addWord} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentTab.wordBank.map((word, i) => (
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

              {/* Speaking Part 2 옵션 */}
              {currentTab.format === "speaking_part2" && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">AI 심화질문 생성</Label>
                    <p className="text-xs text-muted-foreground">Part 2 답변 후 AI가 추가 질문</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentTab.generateFollowup}
                    onChange={(e) => updateCurrentTab("generateFollowup", e.target.checked)}
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
            {/* MCQ */}
            {currentTab.format === "mcq" && (
              <MCQEditor
                question={currentTab.mcqQuestion}
                setQuestion={(v) => updateCurrentTab("mcqQuestion", v)}
                options={currentTab.mcqOptions}
                addOption={addMcqOption}
                removeOption={removeMcqOption}
                updateOption={updateMcqOption}
                toggleCorrect={toggleMcqCorrect}
                isMultiple={currentTab.mcqIsMultiple}
                setIsMultiple={toggleMcqMode}
                maxSelections={currentTab.mcqMaxSelections}
                setMaxSelections={(v) => updateCurrentTab("mcqMaxSelections", v)}
              />
            )}

            {/* T/F/NG */}
            {currentTab.format === "true_false_ng" && (
              <TFNGEditor
                statement={currentTab.tfngStatement}
                setStatement={(v) => updateCurrentTab("tfngStatement", v)}
                answer={currentTab.tfngAnswer}
                setAnswer={(v) => updateCurrentTab("tfngAnswer", v)}
              />
            )}

            {/* 매칭 */}
            {currentTab.format === "matching" && (
              <MatchingEditor
                title={currentTab.matchingTitle}
                setTitle={(v) => updateCurrentTab("matchingTitle", v)}
                allowDuplicate={currentTab.matchingAllowDuplicate}
                setAllowDuplicate={(v) => updateCurrentTab("matchingAllowDuplicate", v)}
                options={currentTab.matchingOptions}
                addOption={addMatchingOption}
                removeOption={removeMatchingOption}
                updateOption={updateMatchingOption}
                items={currentTab.matchingItems}
                addItem={addMatchingItem}
                updateItem={updateMatchingItem}
                removeItem={removeMatchingItem}
              />
            )}

            {/* 빈칸채우기 */}
            {(currentTab.format === "fill_blank_typing" || currentTab.format === "fill_blank_drag") && (
              <FillBlankEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                addBlank={addBlank}
                updateBlank={updateBlank}
                removeBlank={removeBlank}
                isDrag={currentTab.format === "fill_blank_drag"}
              />
            )}

            {/* 플로우차트 */}
            {currentTab.format === "flowchart" && (
              <FlowchartEditor
                title={currentTab.flowchartTitle}
                setTitle={(v) => updateCurrentTab("flowchartTitle", v)}
                nodes={currentTab.flowchartNodes}
                setNodes={(v) => updateCurrentTab("flowchartNodes", v)}
                addNode={addFlowchartNode}
                blanks={currentTab.flowchartBlanks}
                addBlank={addFlowchartBlank}
                updateBlank={(id, field, value) => {
                  updateCurrentTab("flowchartBlanks", currentTab.flowchartBlanks.map(b => b.id === id ? { ...b, [field]: value } : b));
                }}
                removeBlank={(id) => updateCurrentTab("flowchartBlanks", currentTab.flowchartBlanks.filter(b => b.id !== id))}
              />
            )}

            {/* Writing */}
            {currentTab.format === "essay" && (
              <WritingEditor
                title={currentTab.writingTitle}
                setTitle={(v) => updateCurrentTab("writingTitle", v)}
                condition={currentTab.writingCondition}
                setCondition={(v) => updateCurrentTab("writingCondition", v)}
                prompt={currentTab.writingPrompt}
                setPrompt={(v) => updateCurrentTab("writingPrompt", v)}
                imageUrl={currentTab.writingImageUrl}
                setImageUrl={(v) => updateCurrentTab("writingImageUrl", v)}
              />
            )}

            {/* Speaking Part 1 */}
            {currentTab.format === "speaking_part1" && (
              <SpeakingPart1Editor
                question={currentTab.speakingQuestion}
                setQuestion={(v) => updateCurrentTab("speakingQuestion", v)}
              />
            )}

            {/* Speaking Part 2 */}
            {currentTab.format === "speaking_part2" && (
              <SpeakingPart2Editor
                topic={currentTab.cueCardTopic}
                setTopic={(v) => updateCurrentTab("cueCardTopic", v)}
                points={currentTab.cueCardPoints}
                setPoints={(v) => updateCurrentTab("cueCardPoints", v)}
              />
            )}

            {/* Speaking Part 3 */}
            {currentTab.format === "speaking_part3" && (
              <SpeakingPart3Editor
                question={currentTab.speakingQuestion}
                setQuestion={(v) => updateCurrentTab("speakingQuestion", v)}
              />
            )}
          </div>
        </div>
      </div>

      {/* 미리보기 다이얼로그 */}
      <PreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        questionType={selectedQuestionType}
        tab={currentTab}
      />
    </div>
  );
}

// =============================================================================
// format labels (편의용)
// =============================================================================
const formatLabels: Record<string, string> = {
  mcq: "객관식",
  true_false_ng: "T/F/NG",
  matching: "매칭",
  fill_blank_typing: "빈칸(직접입력)",
  fill_blank_drag: "빈칸(드래그)",
  flowchart: "플로우차트",
  essay: "에세이",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

// =============================================================================
// MCQ 에디터 (통합: 단일/복수)
// =============================================================================
function MCQEditor({
  question,
  setQuestion,
  options,
  addOption,
  removeOption,
  updateOption,
  toggleCorrect,
  isMultiple,
  setIsMultiple,
  maxSelections,
  setMaxSelections,
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

  return (
    <div className="space-y-6">
      {/* 모드 선택 */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">선택 방식:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMultiple(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
              }`}
            >
              단일선택 (라디오)
            </button>
            <button
              onClick={() => setIsMultiple(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
              }`}
            >
              복수선택 (체크박스)
            </button>
          </div>
        </div>
        {isMultiple && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">정답 개수:</Label>
            <Select value={maxSelections.toString()} onValueChange={(v) => setMaxSelections(parseInt(v))}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.max(0, options.length - 1) }, (_, i) => i + 2).map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}개</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">(현재 {correctCount}개 선택됨)</span>
          </div>
        )}
      </div>

      {/* 문제 */}
      <div className="space-y-2">
        <Label>문제 *</Label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="문제를 입력하세요"
          rows={3}
        />
      </div>

      {/* 선택지 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>선택지 *</Label>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            선택지 추가
          </Button>
        </div>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <button
              onClick={() => toggleCorrect(option.id)}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold transition-colors ${
                option.isCorrect
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-slate-300 hover:border-primary"
              }`}
            >
              {option.label}
            </button>
            <Input
              className="flex-1"
              value={option.text}
              onChange={(e) => updateOption(option.id, "text", e.target.value)}
              placeholder={`선택지 ${option.label}`}
            />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          {isMultiple
            ? `정답을 ${maxSelections}개 선택하세요 (클릭하여 토글)`
            : "정답을 클릭하세요 (하나만 선택 가능)"}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// T/F/NG 에디터
// =============================================================================
function TFNGEditor({
  statement,
  setStatement,
  answer,
  setAnswer,
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
// 매칭 에디터
// =============================================================================
function MatchingEditor({
  title,
  setTitle,
  allowDuplicate,
  setAllowDuplicate,
  options,
  addOption,
  removeOption,
  updateOption,
  items,
  addItem,
  updateItem,
  removeItem,
}: {
  title: string;
  setTitle: (v: string) => void;
  allowDuplicate: boolean;
  setAllowDuplicate: (v: boolean) => void;
  options: MatchingOption[];
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, text: string) => void;
  items: MatchingItem[];
  addItem: () => void;
  updateItem: (id: string, field: keyof MatchingItem, value: unknown) => void;
  removeItem: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>문항 제목 (선택)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: Questions 1-5"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
        <div>
          <Label className="text-sm">중복 선택 허용</Label>
          <p className="text-xs text-muted-foreground">같은 보기를 여러 문항에 사용 가능</p>
        </div>
        <Switch checked={allowDuplicate} onCheckedChange={setAllowDuplicate} />
      </div>

      {/* 보기 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>보기 (드래그 항목)</Label>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            보기 추가
          </Button>
        </div>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              {option.label}
            </span>
            <Input
              className="flex-1"
              value={option.text}
              onChange={(e) => updateOption(option.id, e.target.value)}
              placeholder={`보기 ${option.label}`}
            />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(option.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 문항 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>문항 목록</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            문항 추가
          </Button>
        </div>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="font-mono font-bold w-8">{item.number}</span>
            <Input
              className="flex-1"
              value={item.statement}
              onChange={(e) => updateItem(item.id, "statement", e.target.value)}
              placeholder="문항 내용"
            />
            <Select
              value={item.correctLabel}
              onValueChange={(v) => updateItem(item.id, "correctLabel", v)}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="정답" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {items.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// 빈칸채우기 에디터
// =============================================================================
function FillBlankEditor({
  title,
  setTitle,
  content,
  setContent,
  blanks,
  addBlank,
  updateBlank,
  removeBlank,
  isDrag,
}: {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  blanks: Blank[];
  addBlank: () => void;
  updateBlank: (id: string, field: keyof Blank, value: unknown) => void;
  removeBlank: (id: string) => void;
  isDrag: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="지문 제목"
        />
      </div>

      <div className="space-y-2">
        <Label>지문 *</Label>
        <p className="text-xs text-muted-foreground">빈칸 위치에 [번호] 형식으로 표시하세요 (예: [1], [2])</p>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="지문을 입력하세요. 빈칸 위치에 [1], [2] 등을 입력하세요."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>빈칸 정답</Label>
          <Button variant="outline" size="sm" onClick={addBlank}>
            <Plus className="h-4 w-4 mr-1" />
            빈칸 추가
          </Button>
        </div>
        {blanks.map((blank) => (
          <div key={blank.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {blank.number}
              </span>
              <Input
                className="flex-1"
                value={blank.answer}
                onChange={(e) => updateBlank(blank.id, "answer", e.target.value)}
                placeholder="정답"
              />
              <Button variant="ghost" size="icon" onClick={() => removeBlank(blank.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="pl-11">
              <Label className="text-xs">대안 정답 (쉼표로 구분)</Label>
              <Input
                className="mt-1"
                value={blank.alternatives.join(", ")}
                onChange={(e) => updateBlank(blank.id, "alternatives", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                placeholder="예: answer1, answer2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// 플로우차트 에디터
// =============================================================================
function FlowchartEditor({
  title,
  setTitle,
  nodes,
  setNodes,
  addNode,
  blanks,
  addBlank,
  updateBlank,
  removeBlank,
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
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>플로우차트 제목 *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: The Process of Making Paper"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>노드 목록</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addNode("box")}>
              <Plus className="h-4 w-4 mr-1" />
              박스 추가
            </Button>
            <Button variant="outline" size="sm" onClick={() => addNode("branch")}>
              <Plus className="h-4 w-4 mr-1" />
              분기 추가
            </Button>
          </div>
        </div>
        {nodes.map((node, index) => (
          <div key={node.id} className={`p-4 border rounded-lg ${node.type === "branch" ? "border-blue-300 bg-blue-50" : ""}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium px-2 py-1 rounded bg-slate-200">
                {node.type === "branch" ? "분기" : "박스"} #{index + 1}
              </span>
              {node.type === "branch" && (
                <Input
                  className="w-40 h-8 text-sm"
                  value={node.label || ""}
                  onChange={(e) => {
                    setNodes(nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n));
                  }}
                  placeholder="분기 라벨"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={() => setNodes(nodes.filter(n => n.id !== node.id))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              value={node.content}
              onChange={(e) => {
                setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n));
              }}
              placeholder="내용 입력 (빈칸은 [번호] 형식)"
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>빈칸 정답</Label>
          <Button variant="outline" size="sm" onClick={addBlank}>
            <Plus className="h-4 w-4 mr-1" />
            빈칸 추가
          </Button>
        </div>
        {blanks.map((blank) => (
          <div key={blank.id} className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              {blank.number}
            </span>
            <Input
              className="flex-1"
              value={blank.answer}
              onChange={(e) => updateBlank(blank.id, "answer", e.target.value)}
              placeholder="정답"
            />
            <Button variant="ghost" size="icon" onClick={() => removeBlank(blank.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Writing 에디터
// =============================================================================
function WritingEditor({
  title,
  setTitle,
  condition,
  setCondition,
  prompt,
  setPrompt,
  imageUrl,
  setImageUrl,
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
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: WRITING TASK 1"
        />
      </div>

      <div className="space-y-2">
        <Label>조건 (선택)</Label>
        <Input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="예: You should spend about 20 minutes on this task."
        />
      </div>

      <div className="space-y-2">
        <Label>프롬프트 *</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="작문 주제를 입력하세요"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label>이미지 URL (선택)</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        {imageUrl && (
          <div className="mt-2 border rounded-lg p-2">
            <img src={imageUrl} alt="Preview" className="max-h-60 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 1 에디터
// =============================================================================
function SpeakingPart1Editor({
  question,
  setQuestion,
}: {
  question: string;
  setQuestion: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
        <p className="font-medium text-violet-900">Part 1: 일상적인 주제에 대한 질문</p>
        <p className="text-sm text-violet-700 mt-1">수험자의 배경, 관심사, 취미 등에 대한 짧은 질문</p>
      </div>

      <div className="space-y-2">
        <Label>질문 *</Label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: What do you do in your free time?"
          rows={3}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 2 에디터
// =============================================================================
function SpeakingPart2Editor({
  topic,
  setTopic,
  points,
  setPoints,
}: {
  topic: string;
  setTopic: (v: string) => void;
  points: string[];
  setPoints: (v: string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
        <p className="font-medium text-violet-900">Part 2: 큐카드 발표</p>
        <p className="text-sm text-violet-700 mt-1">주어진 주제에 대해 1분 준비 후 1~2분간 발표</p>
      </div>

      <div className="space-y-2">
        <Label>큐카드 주제 *</Label>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: Describe a book that you have recently read."
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <Label>You should say: (포인트)</Label>
        {points.map((point, index) => (
          <Input
            key={index}
            value={point}
            onChange={(e) => {
              const newPoints = [...points];
              newPoints[index] = e.target.value;
              setPoints(newPoints);
            }}
            placeholder={`포인트 ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 3 에디터
// =============================================================================
function SpeakingPart3Editor({
  question,
  setQuestion,
}: {
  question: string;
  setQuestion: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
        <p className="font-medium text-violet-900">Part 3: 심화 토론</p>
        <p className="text-sm text-violet-700 mt-1">Part 2 주제와 관련된 추상적이고 심화된 질문</p>
      </div>

      <div className="space-y-2">
        <Label>질문 *</Label>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: Why do you think some people prefer reading books rather than watching movies?"
          rows={3}
        />
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
  tab,
}: {
  open: boolean;
  onClose: () => void;
  questionType: QuestionType | null;
  tab: QuestionTab;
}) {
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
      <DialogContent className="max-w-[1100px] w-[95vw] h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            미리보기 - 실제 시험 화면
            {typeInfo && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 bg-slate-100 min-h-full">
            {/* 지시문 */}
            {tab.instructions && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">{tab.instructions}</p>
              </div>
            )}

            {/* MCQ */}
            {tab.format === "mcq" && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <p className="text-lg">{tab.mcqQuestion || "(문제 입력)"}</p>
                {tab.mcqIsMultiple && (
                  <p className="text-sm text-blue-600">Choose {tab.mcqMaxSelections} answers.</p>
                )}
                <div className="space-y-3 mt-4">
                  {tab.mcqOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className={`w-8 h-8 ${tab.mcqIsMultiple ? "rounded" : "rounded-full"} border-2 flex items-center justify-center`}>
                        {option.label}
                      </div>
                      <span>{option.text || `(선택지 ${option.label})`}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* T/F/NG */}
            {tab.format === "true_false_ng" && (
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
                  <p className="mb-4">{tab.tfngStatement || "(진술문 입력)"}</p>
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

            {/* 매칭 */}
            {tab.format === "matching" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-4 space-y-3">
                  {tab.matchingTitle && <h3 className="font-semibold text-muted-foreground">{tab.matchingTitle}</h3>}
                  {tab.matchingItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <span className="font-mono font-bold">{item.number}</span>
                      <span className="flex-1">{item.statement || "(문항 입력)"}</span>
                      <div className="w-10 h-8 border-2 border-dashed border-slate-400 rounded flex items-center justify-center">
                        ?
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold mb-4">보기 (드래그하여 매칭)</h3>
                  {tab.matchingAllowDuplicate && (
                    <p className="text-xs text-blue-600 mb-3">* 같은 보기를 여러 번 사용할 수 있습니다</p>
                  )}
                  <div className="space-y-2">
                    {tab.matchingOptions.map((option) => (
                      <div key={option.id} className="p-3 bg-slate-50 rounded border-l-4 border-primary cursor-grab hover:bg-slate-100 flex items-center gap-3">
                        <span className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-medium">
                          {option.label}
                        </span>
                        <span>{option.text || "(보기 입력)"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 빈칸채우기 */}
            {(tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag") && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                {tab.contentTitle && <h2 className="text-lg font-bold border-b pb-3">{tab.contentTitle}</h2>}
                <div className="leading-relaxed whitespace-pre-wrap">
                  {renderContent(tab.contentHtml)}
                </div>
                {tab.format === "fill_blank_drag" && tab.wordBank.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Word Bank:</p>
                    <div className="flex flex-wrap gap-2">
                      {tab.wordBank.map((word, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-100 rounded border cursor-grab">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 플로우차트 */}
            {tab.format === "flowchart" && (
              <div className="bg-white rounded-lg border p-6">
                {tab.flowchartTitle && <h2 className="text-lg font-bold text-center mb-6">{tab.flowchartTitle}</h2>}
                <div className="flex flex-col items-center gap-2">
                  {tab.flowchartNodes.map((node, index) => (
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
            {tab.format === "essay" && (
              <div className="bg-white rounded-lg border p-6 space-y-4">
                {tab.writingTitle && <h2 className="text-lg font-bold">{tab.writingTitle}</h2>}
                {tab.writingCondition && <p className="text-sm text-muted-foreground">{tab.writingCondition}</p>}
                <p className="whitespace-pre-wrap">{tab.writingPrompt || "(프롬프트 입력)"}</p>
                {tab.writingImageUrl && (
                  <div className="border rounded-lg p-2">
                    <img src={tab.writingImageUrl} alt="Task" className="max-h-60 mx-auto" />
                  </div>
                )}
              </div>
            )}

            {/* Speaking */}
            {(tab.format === "speaking_part1" || tab.format === "speaking_part3") && (
              <div className="bg-white rounded-lg border p-6">
                <p className="text-xl font-medium">{tab.speakingQuestion || "(질문 입력)"}</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-muted-foreground">녹음 버튼을 눌러 답변하세요</p>
                </div>
              </div>
            )}

            {tab.format === "speaking_part2" && (
              <div className="bg-white rounded-lg border p-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
                  <p className="text-lg font-medium mb-4">{tab.cueCardTopic || "(주제 입력)"}</p>
                  <p className="text-sm text-muted-foreground mb-2">You should say:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {tab.cueCardPoints.map((point, i) => (
                      <li key={i}>{point || `(포인트 ${i + 1})`}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">1분간 준비 후 답변하세요</p>
                    <p className="text-sm text-muted-foreground">1~2분간 발표합니다</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
