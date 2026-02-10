// Re-export shared constants
export { questionTypeInfo, formatIcons, formatDescriptions } from "@/components/questions/constants";

// =============================================================================
// format labels (편의용 - 탭 표시)
// =============================================================================
export const formatLabels: Record<string, string> = {
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
