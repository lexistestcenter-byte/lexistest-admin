import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { QuestionType, Part2Question } from "@/components/questions/types";

export function useSpeakingData(selectedQuestionType: QuestionType | null) {
  const [part2Questions, setPart2Questions] = useState<Part2Question[]>([]);
  const [isLoadingSpeakingData, setIsLoadingSpeakingData] = useState(false);

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

  return { part2Questions, isLoadingSpeakingData };
}
