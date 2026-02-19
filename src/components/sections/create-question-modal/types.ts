import type { QuestionFormat, FlowchartNode } from "@/components/questions/types";

// ─── Props ──────────────────────────────────────────────────

export interface CreateQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: string;
  onCreated: (questionId: string) => void;
}

// ─── Item Types ─────────────────────────────────────────────

export interface BlankItem {
  id: string;
  number: number;
  answer: string;
  alternatives: string;
}

export interface MCQOptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface MatchingOptionItem {
  id: string;
  label: string;
  text: string;
}

export interface MatchingItemData {
  id: string;
  number: number;
  statement: string;
  correctLabel: string;
}

export interface SpeakingSubQuestion {
  id: string;
  text: string;
  timeLimitSeconds: string;
  allowResponseReset: boolean;
  audioUrl: string;
  audioFile: File | null;
}

// ─── Tab State ──────────────────────────────────────────────

export interface TabState {
  id: string;
  selectedFormat: QuestionFormat | null;
  saved: boolean;
  savedQuestionId: string | null;
  // Common
  instructions: string;
  subInstructions: string;
  isPractice: boolean;
  separateNumbers: boolean;
  // MCQ
  mcqQuestion: string;
  mcqIsMultiple: boolean;
  mcqMaxSelections: number;
  mcqSeparateNumbers: boolean;
  mcqDisplayAlphabet: boolean;
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

// ─── ID Generation ──────────────────────────────────────────

let idCounter = 0;

export function genId() {
  return `cqm-${++idCounter}-${Date.now()}`;
}

export function createSpeakingSubQuestion(): SpeakingSubQuestion {
  return {
    id: genId(),
    text: "",
    timeLimitSeconds: "30",
    allowResponseReset: true,
    audioUrl: "",
    audioFile: null,
  };
}

export function createEmptyTab(): TabState {
  return {
    id: `tab-${++idCounter}-${Date.now()}`,
    selectedFormat: null,
    saved: false,
    savedQuestionId: null,
    instructions: "",
    subInstructions: "",
    isPractice: false,
    separateNumbers: true,
    mcqQuestion: "",
    mcqIsMultiple: false,
    mcqMaxSelections: 2,
    mcqSeparateNumbers: false,
    mcqDisplayAlphabet: false,
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

// ─── Format Constants ───────────────────────────────────────

export { formatIcons, formatDescriptions } from "@/components/questions/constants";

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

export function getTabLabel(t: TabState): string {
  if (!t.selectedFormat) return "";
  if (t.selectedFormat === "mcq") {
    return t.mcqIsMultiple ? "복수선택" : "단일선택";
  }
  return formatShortLabels[t.selectedFormat] || t.selectedFormat;
}
