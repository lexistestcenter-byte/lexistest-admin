// =============================================================================
// 문제 유형 (4가지)
// =============================================================================
export type QuestionType = "listening" | "reading" | "writing" | "speaking";

// =============================================================================
// 문제 형태 (question_type별로 다름)
// =============================================================================

// Reading 문제 형태
export type ReadingFormat =
  | "fill_blank_typing"    // 빈칸채우기 (직접입력)
  | "fill_blank_drag"      // 빈칸채우기 (드래그앤드랍/Word Bank)
  | "mcq"                  // 객관식 (UI 통합, 저장 시 mcq_single/mcq_multiple로 분리)
  | "mcq_single"           // 객관식 단일선택 (DB 저장용)
  | "mcq_multiple"         // 객관식 복수선택 (DB 저장용)
  | "true_false_ng"        // True/False/Not Given
  | "matching"             // 매칭 (드래그앤드랍)
  | "flowchart";           // 플로우차트 빈칸채우기

// Listening 문제 형태
export type ListeningFormat =
  | "fill_blank_typing"    // 빈칸채우기 (직접입력)
  | "fill_blank_drag"      // 빈칸채우기 (드래그앤드랍)
  | "mcq"                  // 객관식 (UI 통합)
  | "mcq_single"           // 객관식 단일선택 (DB 저장용)
  | "mcq_multiple"         // 객관식 복수선택 (DB 저장용)
  | "matching";            // 매칭 (드래그앤드랍)

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
  // Reading/Listening
  fill_blank_typing: "빈칸채우기 (직접입력)",
  fill_blank_drag: "빈칸채우기 (드래그앤드랍)",
  mcq: "객관식",
  mcq_single: "객관식 (단일선택)",
  mcq_multiple: "객관식 (복수선택)",
  true_false_ng: "True/False/Not Given",
  matching: "제목 매칭 (드래그앤드랍)",
  flowchart: "플로우차트",
  // Writing
  essay: "에세이",
  // Speaking
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

// question_type별 사용 가능한 format 목록
// UI에서는 "mcq"로 통합 표시, 저장 시 isMultiple에 따라 mcq_single/mcq_multiple로 결정
export const questionFormats = {
  reading: [
    { value: "mcq", label: "객관식" },
    { value: "true_false_ng", label: "True/False/Not Given" },
    { value: "matching", label: "제목 매칭 (드래그앤드랍)" },
    { value: "fill_blank_typing", label: "빈칸채우기 (직접입력)" },
    { value: "fill_blank_drag", label: "빈칸채우기 (드래그앤드랍)" },
    { value: "flowchart", label: "플로우차트" },
  ],
  listening: [
    { value: "mcq", label: "객관식" },
    { value: "matching", label: "제목 매칭 (드래그앤드랍)" },
    { value: "fill_blank_typing", label: "빈칸채우기 (직접입력)" },
    { value: "fill_blank_drag", label: "빈칸채우기 (드래그앤드랍)" },
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
  label: string;    // A, B, C, D, E, ...
  text: string;
  isCorrect: boolean;
}

// T/F/NG 문항
export interface TFNGItem {
  id: string;
  number: number;         // 문제 번호
  statement: string;      // 진술문
  answer: "true" | "false" | "not_given";
}

// 매칭 보기 항목
export interface MatchingOption {
  id: string;
  label: string;          // A, B, C, ...
  text: string;
}

// 매칭 문항
export interface MatchingItem {
  id: string;
  number: number;         // 문제 번호
  statement: string;      // 문항 내용
  correctLabel: string;   // 정답 레이블 (A, B, C, ...)
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

// MCQ (단일/복수선택)
export interface MCQOptionsData {
  title?: string;           // 문항 제목
  question: string;         // 문제
  isMultiple: boolean;      // 복수선택 여부
  maxSelections?: number;   // 복수선택 시 정답 개수
  options: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
}

// T/F/NG
export interface TFNGOptionsData {
  title?: string;           // 문항 제목
  items: {
    number: number;
    statement: string;
    answer: "true" | "false" | "not_given";
  }[];
}

// 매칭 (드래그앤드랍)
export interface MatchingOptionsData {
  title?: string;           // 문항 제목
  allowDuplicate: boolean;  // 같은 보기 중복 사용 가능 여부
  options: {                // 보기 목록
    label: string;
    text: string;
  }[];
  items: {                  // 문항 목록
    number: number;
    statement: string;
    correctLabel: string;
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
