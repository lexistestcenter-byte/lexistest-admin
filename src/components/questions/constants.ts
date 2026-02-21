import {
  BookOpen,
  PenTool,
  Headphones,
  CheckCircle2,
  ListOrdered,
  GripVertical,
  Type,
  GitBranch,
  FileText,
  Mic,
} from "lucide-react";
import type { QuestionType } from "./types";

// =============================================================================
// question_type 별 정보
// =============================================================================
export const questionTypeInfo = [
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

export const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  mcq: CheckCircle2,
  true_false_ng: ListOrdered,
  yes_no_ng: ListOrdered,
  matching: GripVertical,
  fill_blank_typing: Type,
  fill_blank_drag: GripVertical,
  flowchart: GitBranch,
  table_completion: Type,
  short_answer: Type,
  map_labeling: GripVertical,
  essay: FileText,
  speaking_part1: Mic,
  speaking_part2: Mic,
  speaking_part3: Mic,
};

export const formatDescriptions: Record<string, string> = {
  mcq: "단일선택(라디오) 또는 복수선택(체크박스) 객관식",
  true_false_ng: "True / False / Not Given 중 선택 (순서 고정)",
  yes_no_ng: "Yes / No / Not Given 중 선택 (순서 고정)",
  matching: "지문 단락에 맞는 제목을 매칭",
  fill_blank_typing: "학생이 텍스트를 직접 입력",
  fill_blank_drag: "주어진 단어 목록에서 드래그하여 선택",
  flowchart: "플로우차트의 빈칸을 채우는 방식",
  table_completion: "테이블을 완성하는 형식의 문제",
  short_answer: "질문에 대한 짧은 답변을 직접 입력",
  map_labeling: "지도/이미지의 위치에 해당하는 라벨 선택",
  essay: "주어진 주제에 대해 에세이 작성",
  speaking_part1: "일상적인 주제에 대한 짧은 질문과 답변",
  speaking_part2: "큐카드를 보고 1~2분간 발표",
  speaking_part3: "Part 2 주제와 관련된 심화 토론",
};
