import { sanitizeHtmlForDisplay, stripHtml } from "@/lib/utils/sanitize";

// ─── Types ───────────────────────────────────────────────────────

export interface PreviewQuestion {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  instructions: string | null;
  sub_instructions: string | null;
  options_data: Record<string, unknown> | null;
  item_count: number;
  image_url?: string | null;
  // Audio fields (Listening 문제에서 사용)
  audio_url?: string | null;
  audio_transcript?: string | null;
  // Speaking fields
  speaking_category?: string | null;
  related_part2_id?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
}

export interface ContentBlockPreview {
  id: string;
  content_type: "passage" | "audio";
  passage_title?: string;
  passage_content?: string;
  passage_footnotes?: string;
  audio_url?: string;
  audio_transcript?: string;
}

export interface QuestionGroupPreview {
  id: string;
  title: string;
  instructions: string | null;
  subInstructions: string | null;
  contentBlockId: string | null;
  startNum: number;
  endNum: number;
  questionIds: string[];
}

export interface QuestionItem {
  question: PreviewQuestion;
  startNum: number;
  endNum: number;
  groupId: string;
  contentBlockId: string | null;
}

export interface SectionPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: string;
  title: string;
  timeLimit: string;
  isPractice: boolean;
  isLoading?: boolean;
  instructionTitle?: string;
  instructionHtml?: string;
  contentBlocks: ContentBlockPreview[];
  questionGroups: QuestionGroupPreview[];
  questions: PreviewQuestion[];
}

// ─── Common Renderer Props ──────────────────────────────────────

export interface RendererProps {
  item: QuestionItem;
  answers: Record<number, string>;
  setAnswer: (num: number, value: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Detect heading matching: format "heading_matching" OR "matching" with empty item statements + [N] markers */
export function isHeadingMatchingQuestion(q: PreviewQuestion): boolean {
  if (q.question_format === "heading_matching") return true;
  if (q.question_format !== "matching") return false;
  const od = q.options_data || {};
  const items = Array.isArray(od.items) ? (od.items as { statement?: string }[]) : [];
  return (
    items.length > 0 &&
    items.every((entry) => !entry.statement || String(entry.statement).trim() === "") &&
    /\[\d+\]/.test(q.content || "")
  );
}

/** Render as sanitized HTML span — inline mode for titles (paragraphs collapsed) */
export function renderFormattedText(text: string) {
  return (
    <span
      className="[&_p]:inline [&_p]:m-0 [&_br]:content-[''] [&_br]:block"
      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(text) }}
    />
  );
}

/** Render as sanitized HTML div — block mode for instructions (preserves paragraph breaks) */
export function renderBlockHtml(html: string) {
  return (
    <div
      className="prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(html) }}
    />
  );
}

/** Get collapsed label for question item based on format */
export function getCollapsedLabel(item: QuestionItem): string {
  const q = item.question;
  if (q.title) return stripHtml(q.title);

  const fmt = q.question_format;
  const od = q.options_data || {};

  // Flowchart: extract title from JSON content
  if (fmt === "flowchart") {
    try {
      const parsed = JSON.parse(q.content);
      if (parsed?.title) return stripHtml(parsed.title);
    } catch {
      // not JSON
    }
    return "Flowchart";
  }

  // Fill-blank / table: remove [n] markers, prefer options_data.title
  if (
    ["fill_blank_typing", "fill_blank_drag", "table_completion"].includes(fmt)
  ) {
    const odTitle = String(od.title || "");
    if (odTitle) return stripHtml(odTitle);
    const cleaned = stripHtml(q.content || "").replace(/\[\d+\]/g, "___");
    return cleaned || "—";
  }

  // Matching: show item count
  if (fmt === "matching" || fmt === "heading_matching") {
    const items = Array.isArray(od.items) ? od.items : [];
    return `Matching (${items.length} items)`;
  }

  return stripHtml(q.content || "") || "—";
}
