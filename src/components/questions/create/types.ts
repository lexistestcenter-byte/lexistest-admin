import type {
  QuestionFormat,
  Blank,
  MCQOption,
  MatchingOption,
  MatchingItem,
  FlowchartNode,
  MapLabelingItem,
  SpeakingSubQ,
} from "@/components/questions/types";

export type { MapLabelingItem };

// =============================================================================
// 탭 데이터 인터페이스
// =============================================================================
export interface QuestionTab {
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
  writingMinWords: string;

  // Speaking (Part 1 & Part 3: multi-question groups)
  speakingQuestions: SpeakingSubQ[];
  cueCardTopic: string;
  cueCardPoints: string[];
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
  mapLabelingLabels: string[];
  mapLabelingItems: MapLabelingItem[];

  // Common (MCQ 제외한 유형에만 사용)
  instructions: string;
  tags: string;
  isPractice: boolean;

  // Validation
  hasError: boolean;
  errorMessage: string;
}

// 기본 탭 생성 함수
export const createDefaultTab = (): QuestionTab => ({
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
  generateFollowup: false,
  relatedPart2Id: "",
  depthLevel: 1,

  audioUrl: "",
  audioTranscript: "",
  audioFile: null,

  mapLabelingTitle: "",
  mapLabelingPassage: "",
  mapLabelingLabels: ["A", "B", "C", "D", "E", "F", "G", "H"],
  mapLabelingItems: [{ id: "ml1", number: 1, statement: "", correctLabel: "" }],

  instructions: "",
  tags: "",
  isPractice: false,

  hasError: false,
  errorMessage: "",
});
