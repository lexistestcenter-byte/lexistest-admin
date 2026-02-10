"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
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
  Part2Question,
} from "@/components/questions/types";
import { FlowchartEditor } from "@/components/questions/flowchart-editor";
import { TableCompletionEditor } from "@/components/questions/table-completion-editor";
import { FillBlankEditor, FillBlankDragEditor } from "@/components/questions/fill-blank-editor";
import { QuestionPreview, tabToPreviewData } from "@/components/questions/question-preview";
import { FileUpload, uploadFile } from "@/components/ui/file-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

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
  table_completion: Type,
  map_labeling: GripVertical,
  essay: FileText,
  speaking_part1: Mic,
  speaking_part2: Mic,
  speaking_part3: Mic,
};

const formatDescriptions: Record<string, string> = {
  mcq: "단일선택(라디오) 또는 복수선택(체크박스) 객관식",
  true_false_ng: "True / False / Not Given 중 선택 (순서 고정)",
  matching: "지문 단락에 맞는 제목을 매칭",
  fill_blank_typing: "학생이 텍스트를 직접 입력",
  fill_blank_drag: "주어진 단어 목록에서 드래그하여 선택",
  flowchart: "플로우차트의 빈칸을 채우는 방식",
  table_completion: "테이블을 완성하는 형식의 문제",
  map_labeling: "지도/이미지의 위치에 해당하는 라벨 선택",
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
  mcqSeparateNumbers: boolean;

  // 공통: 별도 문항 번호 부여 (multi-item 유형)
  separateNumbers: boolean;

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
  blankMode: "word" | "sentence";
  fillBlankDragAllowDuplicate: boolean;

  // Table Completion
  tableInputMode: "typing" | "drag";

  // Flowchart
  flowchartTitle: string;
  flowchartNodes: FlowchartNode[];
  flowchartBlanks: Blank[];

  // Writing
  writingTitle: string;
  writingCondition: string;
  writingPrompt: string;
  writingImageUrl: string;
  writingMinWords: string;

  // Speaking (Part 1 & Part 3: multi-question groups)
  speakingQuestions: { id: string; text: string; timeLimitSeconds: string; allowResponseReset: boolean; audioUrl: string; audioFile: File | null }[];
  cueCardTopic: string;
  cueCardPoints: string[];
  cueCardImageUrl: string;
  generateFollowup: boolean;
  relatedPart2Id: string;
  depthLevel: 1 | 2 | 3;

  // Audio (Listening 공통)
  audioUrl: string;
  audioTranscript: string;
  audioFile: File | null;

  // Map Labeling
  mapLabelingTitle: string;
  mapLabelingPassage: string;
  mapLabelingImageUrl: string;
  mapLabelingImageFile: File | null;

  // Pending files (deferred upload)
  writingImageFile: File | null;
  cueCardImageFile: File | null;
  mapLabelingLabels: string[];
  mapLabelingItems: { id: string; number: number; statement: string; correctLabel: string }[];

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
  mcqSeparateNumbers: false,
  separateNumbers: true,

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
  blankMode: "word",
  fillBlankDragAllowDuplicate: false,

  tableInputMode: "typing",

  flowchartTitle: "",
  flowchartNodes: [{ id: "n1", type: "box", content: "", row: 0, col: 0 }],
  flowchartBlanks: [],

  writingTitle: "",
  writingCondition: "",
  writingPrompt: "",
  writingImageUrl: "",
  writingMinWords: "",

  speakingQuestions: Array.from({ length: 5 }, (_, i) => ({
    id: `sq-${i}-${Date.now()}`,
    text: "",
    timeLimitSeconds: "30",
    allowResponseReset: true,
    audioUrl: "",
    audioFile: null,
  })),
  cueCardTopic: "",
  cueCardPoints: ["", "", "", ""],
  cueCardImageUrl: "",
  generateFollowup: false,
  relatedPart2Id: "",
  depthLevel: 1,

  audioUrl: "",
  audioTranscript: "",
  audioFile: null,

  mapLabelingTitle: "",
  mapLabelingPassage: "",
  mapLabelingImageUrl: "",
  mapLabelingImageFile: null,
  writingImageFile: null,
  cueCardImageFile: null,
  mapLabelingLabels: ["A", "B", "C", "D", "E", "F", "G", "H"],
  mapLabelingItems: [{ id: "ml1", number: 1, statement: "", correctLabel: "" }],

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

  // Speaking 관련 데이터
  const [part2Questions, setPart2Questions] = useState<Part2Question[]>([]);
  const [isLoadingSpeakingData, setIsLoadingSpeakingData] = useState(false);

  // 현재 활성 탭
  const currentTab = tabs[activeTabIndex];

  // Speaking 데이터 로드 (Part 2 questions for Part 3 linking)
  useEffect(() => {
    if (selectedQuestionType === "speaking") {
      setIsLoadingSpeakingData(true);
      api.get<{ questions: Part2Question[] }>("/api/speaking/part2-questions")
        .then((part2Res) => {
          if (part2Res.error) throw new Error(part2Res.error);
          setPart2Questions(part2Res.data?.questions || []);
        })
        .catch(err => {
          console.error("Failed to load speaking data:", err);
          toast.error("Speaking 데이터 로드 실패");
        })
        .finally(() => setIsLoadingSpeakingData(false));
    }
  }, [selectedQuestionType]);

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

  // MCQ 모드 전환 시 입력 데이터 초기화
  const toggleMcqMode = (isMultiple: boolean) => {
    const hasData = currentTab.mcqQuestion.trim() || currentTab.mcqOptions.some(o => o.text.trim() || o.isCorrect);
    updateCurrentTab("mcqIsMultiple", isMultiple);
    if (hasData) {
      updateCurrentTab("mcqQuestion", "");
      updateCurrentTab("mcqOptions", [
        { id: "a", label: "A", text: "", isCorrect: false },
        { id: "b", label: "B", text: "", isCorrect: false },
        { id: "c", label: "C", text: "", isCorrect: false },
        { id: "d", label: "D", text: "", isCorrect: false },
      ]);
      updateCurrentTab("mcqMaxSelections", 2);
      toast.info("선택 방식이 변경되어 입력 내용이 초기화되었습니다.");
    }
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
  const cleanWord = (s: string) => s.trim();
  const updateWord = (index: number, value: string) => {
    const allowSpaces = currentTab.format === "table_completion";
    // 쉼표가 있으면 분리해서 각각 개별 단어로 추가
    const parts = value.split(",").map(cleanWord).filter(Boolean);
    if (parts.length > 1) {
      const valid = allowSpaces ? parts : parts.filter(p => !/\s/.test(p));
      const invalid = allowSpaces ? [] : parts.filter(p => /\s/.test(p));
      if (invalid.length > 0) toast.warning(`공백이 포함된 단어는 추가할 수 없습니다: ${invalid.join(", ")}`);
      if (valid.length > 0) {
        const newBank = [...currentTab.wordBank];
        newBank[index] = valid[0];
        const extra = valid.slice(1).filter(w => !newBank.includes(w));
        updateCurrentTab("wordBank", [...newBank, ...extra]);
      }
      return;
    }
    // 단일 단어: trim + 공백 검증
    const cleaned = cleanWord(value);
    if (!allowSpaces && cleaned && /\s/.test(cleaned)) {
      toast.warning("공백이 포함된 단어는 추가할 수 없습니다. 단일 단어만 입력해주세요.");
      return;
    }
    const newBank = [...currentTab.wordBank];
    newBank[index] = cleaned;
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
      label: "",
    }]);
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
      if (!tab.contentHtml.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 지문을 입력하세요.` };
      }
      const emptyOptions = tab.matchingOptions.filter(o => !o.text.trim());
      if (emptyOptions.length > 0) {
        const labels = emptyOptions.map(o => o.label).join(", ");
        return { valid: false, message: `탭 ${index + 1}: 제목 ${labels}의 텍스트를 입력하세요.` };
      }
      // 지문에서 섹션 번호 파싱
      const sectionText = tab.contentHtml.replace(/<[^>]*>/g, "");
      const sectionNums: number[] = [];
      const sectionRe = /\[(\d+)\]/g;
      let sm;
      while ((sm = sectionRe.exec(sectionText)) !== null) sectionNums.push(parseInt(sm[1]));
      const uniqueSections = [...new Set(sectionNums)];
      if (uniqueSections.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 지문에 섹션 마커 [1], [2] 등을 추가하세요.` };
      }
      const assignedSections = new Set(tab.matchingItems.map(i => i.number));
      const unassigned = uniqueSections.filter(n => !assignedSections.has(n));
      if (unassigned.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 섹션 [${unassigned.join("], [")}]에 정답 제목을 지정하세요.` };
      }
    }

    // 빈칸채우기 검증
    if (format === "fill_blank_typing" || format === "fill_blank_drag" || format === "table_completion") {
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
      if (!tab.writingTitle.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 제목을 입력하세요.` };
      }
      if (!tab.writingMinWords.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 최소 단어 수를 입력하세요.` };
      }
      if (!tab.writingPrompt.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 작문 주제를 입력하세요.` };
      }
    }

    // Speaking 검증
    if (format === "speaking_part1" || format === "speaking_part3") {
      const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
      if (filledQuestions.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 질문을 1개 이상 입력하세요.` };
      }
    }

    if (format === "speaking_part2") {
      if (!tab.cueCardTopic.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 큐카드 주제를 입력하세요.` };
      }
    }

    if (format === "speaking_part3") {
      if (!tab.relatedPart2Id) {
        return { valid: false, message: `탭 ${index + 1}: 연결된 Part 2 질문을 선택하세요.` };
      }
    }

    // Map Labeling 검증
    if (format === "map_labeling") {
      if (!tab.mapLabelingImageUrl.trim()) {
        return { valid: false, message: `탭 ${index + 1}: 지도/이미지 URL을 입력하세요.` };
      }
      if (tab.mapLabelingItems.length === 0) {
        return { valid: false, message: `탭 ${index + 1}: 문제 항목을 추가하세요.` };
      }
      const emptyItems = tab.mapLabelingItems.filter(i => !i.statement.trim() || !i.correctLabel);
      if (emptyItems.length > 0) {
        return { valid: false, message: `탭 ${index + 1}: 모든 문제 항목과 정답 라벨을 입력하세요.` };
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
            separateNumbers: tab.mcqIsMultiple ? tab.mcqSeparateNumbers : undefined,
            options: tab.mcqOptions.map(o => ({
              label: o.label,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          };
        } else if (tab.format === "true_false_ng") {
          content = tab.tfngStatement;
          optionsData = {
            separateNumbers: tab.separateNumbers,
          };
          answerData = {
            answer: tab.tfngAnswer,
          };
        } else if (tab.format === "matching") {
          content = tab.contentHtml;
          optionsData = {
            title: tab.matchingTitle || undefined,
            separateNumbers: tab.separateNumbers,
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
          answerData = {
            matches: tab.matchingItems.map(i => ({ number: i.number, correctLabel: i.correctLabel })),
          };
        } else if (tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag") {
          content = tab.contentHtml;
          optionsData = {
            title: tab.contentTitle || undefined,
            separateNumbers: tab.separateNumbers,
            blank_mode: tab.blankMode,
            ...(tab.format === "fill_blank_drag" ? { word_bank: tab.wordBank, allow_duplicate: tab.fillBlankDragAllowDuplicate } : {}),
          };
          answerData = {
            blanks: tab.blanks.map(b => ({
              number: b.number,
              answer: b.answer,
              alternatives: b.alternatives,
            })),
          };
        } else if (tab.format === "table_completion") {
          content = tab.contentHtml;
          optionsData = {
            title: tab.contentTitle || undefined,
            separateNumbers: tab.separateNumbers,
            blank_mode: tab.blankMode,
            input_mode: tab.tableInputMode,
            ...(tab.tableInputMode === "drag" ? { word_bank: tab.wordBank } : {}),
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
          optionsData = {
            separateNumbers: tab.separateNumbers,
          };
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
            min_words: tab.writingMinWords ? parseInt(tab.writingMinWords) : undefined,
          };
        } else if (tab.format === "speaking_part1") {
          const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
          content = filledQuestions[0]?.text || "";
          optionsData = {
            questions: filledQuestions.map((q, i) => ({
              number: i + 1,
              text: q.text,
              time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
              allow_response_reset: q.allowResponseReset,
              audio_url: q.audioUrl && !q.audioFile ? q.audioUrl : undefined,
            })),
          };
        } else if (tab.format === "speaking_part2") {
          content = JSON.stringify({
            topic: tab.cueCardTopic,
            points: tab.cueCardPoints.filter(p => p.trim()),
          });
          optionsData = {
            generate_followup: tab.generateFollowup,
            image_url: tab.cueCardImageUrl || undefined,
          };
        } else if (tab.format === "speaking_part3") {
          const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
          content = filledQuestions[0]?.text || "";
          optionsData = {
            questions: filledQuestions.map((q, i) => ({
              number: i + 1,
              text: q.text,
              time_limit_seconds: q.timeLimitSeconds ? parseInt(q.timeLimitSeconds) : 30,
              allow_response_reset: q.allowResponseReset,
              audio_url: q.audioUrl && !q.audioFile ? q.audioUrl : undefined,
            })),
          };
        } else if (tab.format === "map_labeling") {
          content = tab.mapLabelingPassage || " ";
          optionsData = {
            title: tab.mapLabelingTitle || undefined,
            image_url: tab.mapLabelingImageUrl,
            labels: tab.mapLabelingLabels,
            items: tab.mapLabelingItems.map(i => ({
              number: i.number,
              statement: i.statement,
              correctLabel: i.correctLabel,
            })),
            separateNumbers: tab.separateNumbers,
          };
          answerData = {
            items: tab.mapLabelingItems.map(i => ({
              number: i.number,
              correctLabel: i.correctLabel,
            })),
          };
        }

        // 1단계: 파일 URL 제외하고 문제 저장 (deferred 파일은 blob URL이므로)
        const payload = {
          question_type: selectedQuestionType,
          question_format: actualFormat,
          content,
          title: tab.format === "fill_blank_typing" || tab.format === "fill_blank_drag" || tab.format === "table_completion"
            ? tab.contentTitle
            : tab.format === "essay"
              ? tab.writingTitle
              : tab.format === "map_labeling"
                ? tab.mapLabelingTitle || undefined
                : undefined,
          instructions: (tab.format !== "mcq" && tab.format !== "true_false_ng") ? tab.instructions || undefined : undefined,
          options_data: Object.keys(optionsData).length > 0 ? optionsData : undefined,
          answer_data: Object.keys(answerData).length > 0 ? answerData : undefined,
          tags: (tab.format !== "mcq" && tab.format !== "true_false_ng" && tab.tags) ? tab.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
          is_practice: tab.isPractice,
          generate_followup: tab.format === "speaking_part2" ? tab.generateFollowup : undefined,
          // Audio: deferred 파일이 있으면 URL 제외, 없으면 기존 URL 사용 (Part 1/3는 per-question audio)
          audio_url: (selectedQuestionType === "listening" || tab.format === "speaking_part2") && tab.audioUrl && !tab.audioFile ? tab.audioUrl : undefined,
          audio_transcript: (selectedQuestionType === "listening" || tab.format === "speaking_part2") && tab.audioTranscript ? tab.audioTranscript : undefined,
          // Speaking fields
          related_part2_id: tab.format === "speaking_part3" ? tab.relatedPart2Id || undefined : undefined,
          depth_level: tab.format === "speaking_part3" ? tab.depthLevel : undefined,
        };

        // options_data에서 blob URL 제거 (이미지/오디오는 나중에 업로드 후 업데이트)
        if (payload.options_data) {
          const od = payload.options_data as Record<string, unknown>;
          if (od.image_url && typeof od.image_url === "string" && (od.image_url as string).startsWith("blob:")) {
            delete od.image_url;
          }
          if (Array.isArray(od.questions)) {
            for (const q of od.questions as Record<string, unknown>[]) {
              if (q.audio_url && typeof q.audio_url === "string" && (q.audio_url as string).startsWith("blob:")) {
                delete q.audio_url;
              }
            }
          }
        }

        const { data: result, error } = await api.post<{ id: string; question_code: string }>("/api/questions", payload);

        if (error || !result) throw new Error(error || "저장 실패");
        const questionId = result.id;
        const questionCode = result.question_code;

        // 2단계: pending 파일이 있으면 코드 기반 경로로 R2 업로드
        if (questionId && questionCode) {
          const context = `questions/${questionCode}`;
          const updatePayload: Record<string, unknown> = {};

          // 오디오 파일 업로드 (Part 2 / listening)
          if (tab.audioFile) {
            const uploaded = await uploadFile(tab.audioFile, "audio", context);
            updatePayload.audio_url = uploaded.path;
          }

          // Per-sub-question audio upload for Part 1 / Part 3
          if (tab.format === "speaking_part1" || tab.format === "speaking_part3") {
            const filledQuestions = tab.speakingQuestions.filter((q) => q.text.trim());
            const questionsWithAudio = filledQuestions.filter((q) => q.audioFile);
            if (questionsWithAudio.length > 0) {
              const existingOd = (payload.options_data || {}) as Record<string, unknown>;
              const questions = (existingOd.questions || []) as Record<string, unknown>[];
              for (const sq of questionsWithAudio) {
                const idx = filledQuestions.indexOf(sq);
                if (idx >= 0 && questions[idx]) {
                  try {
                    const uploaded = await uploadFile(sq.audioFile!, "audio", `${context}/q${idx + 1}`);
                    questions[idx].audio_url = uploaded.path;
                  } catch {
                    toast.error("일부 질문 오디오 업로드에 실패했습니다.");
                  }
                }
              }
              updatePayload.options_data = { ...existingOd, questions };
            }
          }

          // 이미지 파일 업로드 (writing, speaking part2, map_labeling)
          const imageFile = tab.writingImageFile || tab.cueCardImageFile || tab.mapLabelingImageFile;
          if (imageFile) {
            const uploaded = await uploadFile(imageFile, "image", context);
            // options_data에 image_url 추가
            const existingOptions = payload.options_data || {};
            updatePayload.options_data = { ...existingOptions as Record<string, unknown>, image_url: uploaded.path };
          }

          // 업데이트할 내용이 있으면 PUT 요청
          if (Object.keys(updatePayload).length > 0) {
            const { error: updateError } = await api.put(`/api/questions/${questionId}`, updatePayload);
            if (updateError) {
              console.error("파일 URL 업데이트 실패:", updateError);
              toast.error("파일 URL 업데이트에 실패했습니다. 상세 페이지에서 다시 저장해주세요.");
            }
          }
        }

        return result;
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
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${index === activeTabIndex
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
          <Button variant="ghost" size="sm" onClick={() => {
            const defaultTab = createDefaultTab();
            setTabs(prevTabs => prevTabs.map((tab, idx) =>
              idx === activeTabIndex ? { ...defaultTab, id: tab.id } : tab
            ));
          }}>
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
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${index === activeTabIndex
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
        {/* 왼쪽: 설정 패널 */}
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

              {/* 별도 문항 번호 토글 — multi-item 유형 공통 */}
              {currentTab.format && [
                "true_false_ng", "matching", "heading_matching",
                "fill_blank_typing", "fill_blank_drag",
                "flowchart", "table_completion", "map_labeling",
              ].includes(currentTab.format) && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">별도 문항 번호 부여</Label>
                    <p className="text-xs text-muted-foreground">
                      {currentTab.separateNumbers
                        ? "각 항목이 별도 문항 번호를 차지합니다 (예: Questions 5–8)"
                        : "하나의 문항으로 처리됩니다 (예: Question 5)"}
                    </p>
                  </div>
                  <Switch
                    checked={currentTab.separateNumbers}
                    onCheckedChange={(v) => updateCurrentTab("separateNumbers", v)}
                  />
                </div>
              )}

              {/* 별도 문항 번호 토글 — MCQ 복수선택 */}
              {currentTab.format === "mcq" && currentTab.mcqIsMultiple && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">별도 문항 번호 부여</Label>
                    <p className="text-xs text-muted-foreground">
                      {currentTab.mcqSeparateNumbers
                        ? `각 정답이 별도 문항 번호를 차지합니다 (예: Questions 5–${4 + currentTab.mcqMaxSelections})`
                        : "하나의 문항으로 처리됩니다 (예: Question 5)"}
                    </p>
                  </div>
                  <Switch
                    checked={currentTab.mcqSeparateNumbers}
                    onCheckedChange={(v) => updateCurrentTab("mcqSeparateNumbers", v)}
                  />
                </div>
              )}

            </div>

            {/* Audio Settings (Listening & Speaking Part 2) */}
            {(selectedQuestionType === "listening" || currentTab.format === "speaking_part2") && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">오디오 설정</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">오디오 파일 (선택)</Label>
                    <FileUpload
                      value={currentTab.audioUrl}
                      onChange={(url) => updateCurrentTab("audioUrl", url)}
                      accept="audio"
                      deferred
                      onFileReady={(file) => updateCurrentTab("audioFile", file)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Word Bank (fill_blank_drag or table_completion drag) */}
            {(currentTab.format === "fill_blank_drag" || (currentTab.format === "table_completion" && currentTab.tableInputMode === "drag")) && (
              <div className="space-y-3">
                <Label className="text-xs">Word Bank</Label>
                {/* 정답 단어 (자동) */}
                {currentTab.blanks.filter(b => b.answer.trim()).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">정답 단어 (자동)</p>
                    <div className="flex flex-wrap gap-1">
                      {currentTab.blanks.filter(b => b.answer.trim()).map((b) => (
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
                    {currentTab.wordBank.filter(w => !currentTab.blanks.some(b => b.answer === w)).length === 0 && currentTab.wordBank.filter(w => currentTab.blanks.some(b => b.answer === w)).length === currentTab.wordBank.length && currentTab.blanks.length > 0 ? (
                      <p className="text-xs text-muted-foreground italic">함정 단어를 추가하세요</p>
                    ) : null}
                    {currentTab.wordBank.map((word, i) => {
                      const isAutoWord = currentTab.blanks.some(b => b.answer === word);
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
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                allowDuplicate={currentTab.matchingAllowDuplicate}
                setAllowDuplicate={(v) => updateCurrentTab("matchingAllowDuplicate", v)}
                options={currentTab.matchingOptions}
                addOption={addMatchingOption}
                removeOption={removeMatchingOption}
                updateOption={updateMatchingOption}
                items={currentTab.matchingItems}
                setItems={(v) => updateCurrentTab("matchingItems", v)}
              />
            )}

            {/* 빈칸채우기 (직접입력) */}
            {currentTab.format === "fill_blank_typing" && (
              <FillBlankEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                setBlanks={(v) => updateCurrentTab("blanks", v)}
                blankMode={currentTab.blankMode}
                setBlankMode={(v) => updateCurrentTab("blankMode", v)}
              />
            )}

            {/* 빈칸채우기 (드래그앤드랍) */}
            {currentTab.format === "fill_blank_drag" && (
              <FillBlankDragEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                setBlanks={(v) => updateCurrentTab("blanks", v)}
                wordBank={currentTab.wordBank}
                setWordBank={(v) => updateCurrentTab("wordBank", v)}
                blankMode={currentTab.blankMode}
                setBlankMode={(v) => updateCurrentTab("blankMode", v)}
                allowDuplicate={currentTab.fillBlankDragAllowDuplicate}
                setAllowDuplicate={(v) => updateCurrentTab("fillBlankDragAllowDuplicate", v)}
              />
            )}

            {/* 테이블 완성하기 */}
            {currentTab.format === "table_completion" && (
              <TableCompletionEditor
                title={currentTab.contentTitle}
                setTitle={(v) => updateCurrentTab("contentTitle", v)}
                content={currentTab.contentHtml}
                setContent={(v) => updateCurrentTab("contentHtml", v)}
                blanks={currentTab.blanks}
                setBlanks={(v) => updateCurrentTab("blanks", v)}
                wordBank={currentTab.wordBank}
                setWordBank={(v) => updateCurrentTab("wordBank", v)}
                blankMode={currentTab.blankMode}
                setBlankMode={(v) => updateCurrentTab("blankMode", v)}
                inputMode={currentTab.tableInputMode}
                setInputMode={(v) => updateCurrentTab("tableInputMode", v)}
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
                setBlanks={(v) => updateCurrentTab("flowchartBlanks", v)}
                updateBlank={(id, field, value) => {
                  updateCurrentTab("flowchartBlanks", currentTab.flowchartBlanks.map(b => b.id === id ? { ...b, [field]: value } : b));
                }}
                instructions={currentTab.instructions}
                setInstructions={(v) => updateCurrentTab("instructions", v)}
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
                onImageFileReady={(file) => updateCurrentTab("writingImageFile", file)}
                minWords={currentTab.writingMinWords}
                setMinWords={(v) => updateCurrentTab("writingMinWords", v)}
              />
            )}

            {/* Speaking Part 1 */}
            {currentTab.format === "speaking_part1" && (
              <SpeakingPart1Editor
                questions={currentTab.speakingQuestions}
                setQuestions={(v) => updateCurrentTab("speakingQuestions", v)}
              />
            )}

            {/* Speaking Part 2 */}
            {currentTab.format === "speaking_part2" && (
              <SpeakingPart2Editor
                topic={currentTab.cueCardTopic}
                setTopic={(v) => updateCurrentTab("cueCardTopic", v)}
                points={currentTab.cueCardPoints}
                setPoints={(v) => updateCurrentTab("cueCardPoints", v)}
                imageUrl={currentTab.cueCardImageUrl}
                setImageUrl={(v) => updateCurrentTab("cueCardImageUrl", v)}
                onImageFileReady={(file) => updateCurrentTab("cueCardImageFile", file)}
              />
            )}

            {/* Speaking Part 3 */}
            {currentTab.format === "speaking_part3" && (
              <SpeakingPart3Editor
                questions={currentTab.speakingQuestions}
                setQuestions={(v) => updateCurrentTab("speakingQuestions", v)}
                relatedPart2Id={currentTab.relatedPart2Id}
                setRelatedPart2Id={(v) => updateCurrentTab("relatedPart2Id", v)}
                part2Questions={part2Questions}
                depthLevel={currentTab.depthLevel}
                setDepthLevel={(v) => updateCurrentTab("depthLevel", v)}
                isLoading={isLoadingSpeakingData}
              />
            )}

            {/* Map Labeling */}
            {currentTab.format === "map_labeling" && (
              <MapLabelingEditor
                title={currentTab.mapLabelingTitle}
                setTitle={(v) => updateCurrentTab("mapLabelingTitle", v)}
                passage={currentTab.mapLabelingPassage}
                setPassage={(v) => updateCurrentTab("mapLabelingPassage", v)}
                imageUrl={currentTab.mapLabelingImageUrl}
                setImageUrl={(v) => updateCurrentTab("mapLabelingImageUrl", v)}
                onImageFileReady={(file) => updateCurrentTab("mapLabelingImageFile", file)}
                labels={currentTab.mapLabelingLabels}
                setLabels={(v) => updateCurrentTab("mapLabelingLabels", v)}
                items={currentTab.mapLabelingItems}
                setItems={(v) => updateCurrentTab("mapLabelingItems", v)}
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
  matching: "제목매칭",
  fill_blank_typing: "빈칸(직접입력)",
  fill_blank_drag: "빈칸(드래그)",
  flowchart: "플로우차트",
  table_completion: "테이블(완성)",
  map_labeling: "지도라벨링",
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
                }`}
            >
              단일선택 (라디오)
            </button>
            <button
              onClick={() => setIsMultiple(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isMultiple ? "bg-primary text-white" : "bg-white border hover:bg-slate-50"
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
        <Label>문제 <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={question}
          onChange={setQuestion}
          placeholder="문제를 입력하세요"
          minHeight="80px"
        />
      </div>

      {/* 선택지 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>선택지 <span className="text-red-500">*</span></Label>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            선택지 추가
          </Button>
        </div>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <button
              onClick={() => toggleCorrect(option.id)}
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold transition-colors ${option.isCorrect
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
          <Label>문제 제목</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" />
        </div>
        <div className="space-y-2">
          <Label>문제 내용 <span className="text-red-500">*</span></Label>
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
  title,
  setTitle,
  condition,
  setCondition,
  prompt,
  setPrompt,
  imageUrl,
  setImageUrl,
  onImageFileReady,
  minWords,
  setMinWords,
}: {
  title: string;
  setTitle: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  onImageFileReady?: (file: File | null) => void;
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
        <div className="space-y-2">
          <Label>제목 <span className="text-red-500">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: WRITING TASK 1"
          />
        </div>

        <div className="space-y-2">
          <Label>최소 단어 수 <span className="text-red-500">*</span></Label>
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

      <div className="space-y-2">
        <Label>조건 (선택)</Label>
        <Input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="예: You should spend about 20 minutes on this task."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>작문 주제 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">Ctrl+B: 굵게</p>
        </div>
        <RichTextEditor
          value={prompt}
          onChange={setPrompt}
          placeholder="작문 주제를 입력하세요"
          minHeight="200px"
        />
      </div>

      <div className="space-y-2">
        <Label>이미지 (선택 - Task 1 그래프/차트용)</Label>
        <FileUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          placeholder="Task 1 그래프/차트 이미지 업로드"
          deferred
          onFileReady={onImageFileReady}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 1 에디터 (Multi-question group)
// =============================================================================
type SpeakingSubQ = { id: string; text: string; timeLimitSeconds: string; allowResponseReset: boolean; audioUrl: string; audioFile: File | null };

function SpeakingPart1Editor({
  questions,
  setQuestions,
}: {
  questions: SpeakingSubQ[];
  setQuestions: (v: SpeakingSubQ[]) => void;
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const filledCount = questions.filter((q) => q.text.trim()).length;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getTextPreview = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length > 40 ? text.slice(0, 40) + "..." : text || "비어있음";
  };

  const updateSubQ = (id: string, updates: Partial<SpeakingSubQ>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addSubQ = () => {
    const newId = `sq-${Date.now()}`;
    setQuestions([...questions, { id: newId, text: "", timeLimitSeconds: "30", allowResponseReset: true, audioUrl: "", audioFile: null }]);
    setExpandedCards((prev) => new Set(prev).add(newId));
  };

  const removeSubQ = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
    setExpandedCards((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="font-medium text-emerald-900">Part 1: Interview</p>
        <p className="text-sm text-emerald-700 mt-1">일상적인 주제에 대한 짧은 질문 그룹. 각 질문별로 시간 제한과 설정을 지정합니다.</p>
      </div>

      {/* Question count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filledCount}</span> / {questions.length} 질문 입력됨
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const allIds = questions.map((q) => q.id);
              const allExpanded = allIds.every((id) => expandedCards.has(id));
              setExpandedCards(allExpanded ? new Set() : new Set(allIds));
            }}
          >
            {questions.every((q) => expandedCards.has(q.id)) ? "모두 접기" : "모두 펼치기"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={addSubQ}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            질문 추가
          </Button>
        </div>
      </div>

      {/* Question grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {questions.map((sq, idx) => {
          const isExpanded = expandedCards.has(sq.id);
          return (
            <div key={sq.id} className={cn("border border-emerald-200 rounded-lg overflow-hidden", isExpanded && "col-span-2")}>
              {/* Clickable header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-emerald-50 hover:bg-emerald-100 cursor-pointer select-none"
                onClick={() => toggleCard(sq.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  <span className="text-xs font-semibold text-emerald-700 shrink-0">Q{idx + 1}</span>
                  {!isExpanded && <span className="text-xs text-muted-foreground truncate">{getTextPreview(sq.text)}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isExpanded && (
                    <>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] text-muted-foreground">시간:</Label>
                        <Input
                          type="text" inputMode="numeric" maxLength={3}
                          className="h-6 w-14 text-[11px] text-center"
                          value={sq.timeLimitSeconds}
                          onChange={(e) => { const val = e.target.value; if (val === "" || /^\d{1,3}$/.test(val)) updateSubQ(sq.id, { timeLimitSeconds: val }); }}
                          placeholder="30"
                        />
                        <span className="text-[10px] text-muted-foreground">초</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] text-muted-foreground">재녹음:</Label>
                        <input type="checkbox" checked={sq.allowResponseReset} onChange={(e) => updateSubQ(sq.id, { allowResponseReset: e.target.checked })} className="h-3.5 w-3.5" />
                      </div>
                    </>
                  )}
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSubQ(sq.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Body - only when expanded */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  <RichTextEditor
                    value={sq.text}
                    onChange={(v) => updateSubQ(sq.id, { text: v })}
                    placeholder={`Q${idx + 1}: e.g. What do you do in your free time?`}
                    minHeight="60px"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">오디오:</Label>
                    <div className="flex-1">
                      <FileUpload
                        value={sq.audioUrl}
                        onChange={(v) => updateSubQ(sq.id, { audioUrl: v })}
                        accept="audio"
                        placeholder="시험관 오디오 업로드 (선택)"
                        deferred
                        onFileReady={(file) => updateSubQ(sq.id, { audioFile: file })}
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
}

// =============================================================================
// Speaking Part 2 에디터
// =============================================================================
function SpeakingPart2Editor({
  topic,
  setTopic,
  points,
  setPoints,
  imageUrl,
  setImageUrl,
  onImageFileReady,
}: {
  topic: string;
  setTopic: (v: string) => void;
  points: string[];
  setPoints: (v: string[]) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  onImageFileReady?: (file: File | null) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="font-medium text-amber-900">Part 2: 큐카드 발표</p>
        <p className="text-sm text-amber-700 mt-1">주어진 주제에 대해 1분 준비 후 1~2분간 발표</p>
      </div>

      <div className="space-y-2">
        <RequiredLabel>큐카드 주제</RequiredLabel>
        <RichTextEditor
          value={topic}
          onChange={setTopic}
          placeholder="예: Describe a book that you have recently read."
          minHeight="60px"
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

      {/* 큐카드 이미지 */}
      <div className="space-y-2">
        <Label>큐카드 이미지 (선택)</Label>
        <FileUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          placeholder="큐카드 이미지 업로드"
          deferred
          onFileReady={onImageFileReady}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Speaking Part 3 에디터 (Multi-question group)
// =============================================================================
function SpeakingPart3Editor({
  questions,
  setQuestions,
  relatedPart2Id,
  setRelatedPart2Id,
  part2Questions,
  depthLevel,
  setDepthLevel,
  isLoading,
}: {
  questions: SpeakingSubQ[];
  setQuestions: (v: SpeakingSubQ[]) => void;
  relatedPart2Id: string;
  setRelatedPart2Id: (v: string) => void;
  part2Questions: Part2Question[];
  depthLevel: 1 | 2 | 3;
  setDepthLevel: (v: 1 | 2 | 3) => void;
  isLoading?: boolean;
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const filledCount = questions.filter((q) => q.text.trim()).length;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getTextPreview = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length > 40 ? text.slice(0, 40) + "..." : text || "비어있음";
  };

  const updateSubQ = (id: string, updates: Partial<SpeakingSubQ>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addSubQ = () => {
    const newId = `sq-${Date.now()}`;
    setQuestions([...questions, { id: newId, text: "", timeLimitSeconds: "30", allowResponseReset: true, audioUrl: "", audioFile: null }]);
    setExpandedCards((prev) => new Set(prev).add(newId));
  };

  const removeSubQ = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
    setExpandedCards((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
        <p className="font-medium text-violet-900">Part 3: 심화 토론</p>
        <p className="text-sm text-violet-700 mt-1">Part 2 주제와 관련된 추상적이고 심화된 질문 그룹</p>
      </div>

      {/* Part 2 연결 */}
      <div className="space-y-2">
        <RequiredLabel>연결된 Part 2 질문</RequiredLabel>
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

      {/* Question count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filledCount}</span> / {questions.length} 질문 입력됨
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const allIds = questions.map((q) => q.id);
              const allExpanded = allIds.every((id) => expandedCards.has(id));
              setExpandedCards(allExpanded ? new Set() : new Set(allIds));
            }}
          >
            {questions.every((q) => expandedCards.has(q.id)) ? "모두 접기" : "모두 펼치기"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={addSubQ}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            질문 추가
          </Button>
        </div>
      </div>

      {/* Question grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {questions.map((sq, idx) => {
          const isExpanded = expandedCards.has(sq.id);
          return (
            <div key={sq.id} className={cn("border border-violet-200 rounded-lg overflow-hidden", isExpanded && "col-span-2")}>
              {/* Clickable header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-violet-50 hover:bg-violet-100 cursor-pointer select-none"
                onClick={() => toggleCard(sq.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-violet-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                  <span className="text-xs font-semibold text-violet-700 shrink-0">Q{idx + 1}</span>
                  {!isExpanded && <span className="text-xs text-muted-foreground truncate">{getTextPreview(sq.text)}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isExpanded && (
                    <>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] text-muted-foreground">시간:</Label>
                        <Input
                          type="text" inputMode="numeric" maxLength={3}
                          className="h-6 w-14 text-[11px] text-center"
                          value={sq.timeLimitSeconds}
                          onChange={(e) => { const val = e.target.value; if (val === "" || /^\d{1,3}$/.test(val)) updateSubQ(sq.id, { timeLimitSeconds: val }); }}
                          placeholder="30"
                        />
                        <span className="text-[10px] text-muted-foreground">초</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] text-muted-foreground">재녹음:</Label>
                        <input type="checkbox" checked={sq.allowResponseReset} onChange={(e) => updateSubQ(sq.id, { allowResponseReset: e.target.checked })} className="h-3.5 w-3.5" />
                      </div>
                    </>
                  )}
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSubQ(sq.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Body - only when expanded */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  <RichTextEditor
                    value={sq.text}
                    onChange={(v) => updateSubQ(sq.id, { text: v })}
                    placeholder={`Q${idx + 1}: e.g. Why do you think some people prefer reading books rather than watching movies?`}
                    minHeight="60px"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">오디오:</Label>
                    <div className="flex-1">
                      <FileUpload
                        value={sq.audioUrl}
                        onChange={(v) => updateSubQ(sq.id, { audioUrl: v })}
                        accept="audio"
                        placeholder="시험관 오디오 업로드 (선택)"
                        deferred
                        onFileReady={(file) => updateSubQ(sq.id, { audioFile: file })}
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
  onImageFileReady,
  labels,
  setLabels,
  items,
  setItems,
}: {
  title: string;
  setTitle: (v: string) => void;
  passage: string;
  setPassage: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  onImageFileReady?: (file: File | null) => void;
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
          placeholder="지도/이미지 파일 업로드"
          deferred
          onFileReady={onImageFileReady}
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
  tab,
}: {
  open: boolean;
  onClose: () => void;
  questionType: QuestionType | null;
  tab: QuestionTab;
}) {
  const typeInfo = questionType ? questionTypeInfo.find(t => t.id === questionType) : null;
  const previewData = tab.format ? tabToPreviewData(tab, questionType || "") : null;

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
            {tab.audioUrl && (
              <audio src={tab.audioUrl} autoPlay />
            )}

            {/* 지시문 */}
            {tab.instructions && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">{tab.instructions}</p>
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
