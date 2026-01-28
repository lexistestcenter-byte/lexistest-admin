// =============================================================================
// 문제 유형 (4가지)
// =============================================================================
export type QuestionType = "listening" | "reading" | "writing" | "speaking";

// =============================================================================
// 문제 형태 (question_type별로 다름)
// =============================================================================

// Reading 문제 형태 (5가지)
export type ReadingFormat =
  | "fill_blank_typing"    // 빈칸채우기 (직접입력)
  | "fill_blank_drag"      // 빈칸채우기 (드래그앤드랍/Word Bank)
  | "heading_matching"     // 제목 매칭
  | "mcq"                  // 4지선다
  | "flowchart";           // 플로우차트 빈칸채우기

// Listening 문제 형태
export type ListeningFormat =
  | "fill_blank_typing"    // 빈칸채우기 (직접입력)
  | "fill_blank_drag"      // 빈칸채우기 (드래그앤드랍)
  | "mcq";                 // 4지선다

// Writing 문제 형태
export type WritingFormat = "essay";

// Speaking 문제 형태
export type SpeakingFormat = "speaking_part1" | "speaking_part2" | "speaking_part3";

// 전체 문제 형태
export type QuestionFormat =
  | ReadingFormat
  | ListeningFormat
  | WritingFormat
  | SpeakingFormat;

// =============================================================================
// 문제 형태 레이블
// =============================================================================
export const formatLabels: Record<string, string> = {
  // Reading (5가지)
  fill_blank_typing: "빈칸채우기 (직접입력)",
  fill_blank_drag: "빈칸채우기 (드래그앤드랍)",
  heading_matching: "제목 매칭",
  mcq: "4지선다",
  flowchart: "플로우차트",
  // Writing
  essay: "에세이",
  // Speaking
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

// question_type별 사용 가능한 format 목록
export const questionFormats = {
  reading: [
    { value: "fill_blank_typing", label: "빈칸채우기 (직접입력)" },
    { value: "fill_blank_drag", label: "빈칸채우기 (드래그앤드랍)" },
    { value: "heading_matching", label: "제목 매칭" },
    { value: "mcq", label: "4지선다" },
    { value: "flowchart", label: "플로우차트" },
  ],
  listening: [
    { value: "fill_blank_typing", label: "빈칸채우기 (직접입력)" },
    { value: "fill_blank_drag", label: "빈칸채우기 (드래그앤드랍)" },
    { value: "mcq", label: "4지선다" },
  ],
  writing: [
    { value: "essay", label: "에세이" },
  ],
  speaking: [
    { value: "speaking_part1", label: "Part 1 (짧은 답변)" },
    { value: "speaking_part2", label: "Part 2 (큐카드)" },
    { value: "speaking_part3", label: "Part 3 (심화 질문)" },
  ],
};

// =============================================================================
// 데이터 구조
// =============================================================================

// 빈칸 정답
export interface Blank {
  id: string;
  number: number;
  answer: string;
  alternatives: string[];
}

// MCQ 선택지
export interface MCQOption {
  id: string;
  label: string;    // A, B, C, D
  text: string;
  isCorrect: boolean;
}

// 제목 매칭 - 제목 항목
export interface HeadingItem {
  id: string;
  text: string;
  matchedSection: number | null;  // null이면 오답(distractor)
}

// 플로우차트 노드
export interface FlowchartNode {
  id: string;
  type: "box" | "branch";
  content: string;      // [번호] 형식의 빈칸 포함 가능
  row: number;
  col: number;
  label?: string;       // 분기 라벨 (예: "Theory 1")
}

// =============================================================================
// DB 저장용 options_data 구조 (Reading용)
// =============================================================================

// 빈칸채우기 (직접입력)
export interface FillBlankTypingOptionsData {
  title?: string;
  content: string;              // [번호] 형식으로 빈칸 위치 표시
  blanks: {
    number: number;
    answer: string;
    alternatives: string[];
  }[];
}

// 빈칸채우기 (드래그앤드랍)
export interface FillBlankDragOptionsData {
  title?: string;
  content: string;
  wordBank: string[];           // 단어 목록
  blanks: {
    number: number;
    answer: string;
    alternatives: string[];
  }[];
}

// 제목 매칭
export interface HeadingMatchingOptionsData {
  sections: {
    number: number;
    preview: string;
  }[];
  headings: {
    id: string;
    text: string;
    correctSection: number | null;
  }[];
}

// 4지선다
export interface MCQOptionsData {
  question: string;
  options: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
}

// 플로우차트
export interface FlowchartOptionsData {
  title: string;
  nodes: {
    id: string;
    type: "box" | "branch";
    content: string;
    row: number;
    col: number;
    label?: string;
  }[];
  blanks: {
    number: number;
    answer: string;
    alternatives: string[];
  }[];
}
