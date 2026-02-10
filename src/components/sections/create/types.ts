export type { PreviewQuestion } from "@/components/sections/section-preview";

// ─── Types ─────────────────────────────────────────────────────

export interface Question {
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

export interface ContentBlock {
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

export interface QuestionGroup {
  id: string;
  content_block_id: string | null;
  display_order: number;
  title: string;
  instructions: string;
  questions: string[];
}

// ─── Constants ─────────────────────────────────────────────────

export const TOTAL_STEPS = 2;
export const STEP_LABELS = ["기본 정보", "섹션 구성"];

let tempIdCounter = 0;
export function generateTempId() {
  return `temp-${++tempIdCounter}-${Date.now()}`;
}
