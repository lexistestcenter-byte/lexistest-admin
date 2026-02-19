import type { DragEndEvent } from "@dnd-kit/core";
import type { useSensors } from "@dnd-kit/core";

export const TOTAL_STEPS = 2;
export const STEP_LABELS = ["기본 정보", "시험 구성"];

// ─── Types ─────────────────────────────────────────────────────

export interface SectionData {
  id: string;
  section_type: string;
  title: string;
  description: string | null;
  image_url: string | null;
  instruction_title: string | null;
  instruction_html: string | null;
  passage_title: string | null;
  passage_content: string | null;
  passage_footnotes: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
  time_limit_minutes: number | null;
  difficulty: string | null;
  is_practice: boolean;
  is_active: boolean;
  tags: string[] | null;
}

export interface ContentBlock {
  id: string;
  section_id: string;
  display_order: number;
  content_type: "passage" | "audio";
  passage_title: string | null;
  passage_content: string | null;
  passage_footnotes: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
}

export interface QuestionInfo {
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  item_count: number;
  options_data: Record<string, unknown> | null;
  answer_data: Record<string, unknown> | null;
}

export interface GroupItem {
  item_id: string;
  question_id: string;
  question_number_start: number;
  display_order: number;
  question_info: QuestionInfo;
}

export interface QuestionGroupData {
  id: string;
  section_id: string;
  content_block_id: string | null;
  display_order: number;
  title: string | null;
  instructions: string | null;
  sub_instructions: string | null;
  question_number_start: number;
  items: GroupItem[];
}

export interface AvailableQuestion {
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

export type NumberedItem = GroupItem & { startNum: number; endNum: number };

export interface NumberedGroup extends QuestionGroupData {
  numberedItems: NumberedItem[];
  groupStartNum: number;
  groupEndNum: number;
}

export interface EditGroupCardProps {
  group: {
    id: string;
    content_block_id: string | null;
    title: string | null;
    instructions: string | null;
    sub_instructions: string | null;
    numberedItems: NumberedItem[];
    groupStartNum: number;
    groupEndNum: number;
  };
  isActive: boolean;
  isAddingQuestions: boolean;
  autoTitle: string;
  contentBlocks: ContentBlock[];
  sectionType: string;
  sensors: ReturnType<typeof useSensors>;
  onActivate: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
  onRemoveItem: (itemId: string) => void;
  onItemDragEnd: (event: DragEndEvent) => void;
  onAddQuestions: () => void;
}
