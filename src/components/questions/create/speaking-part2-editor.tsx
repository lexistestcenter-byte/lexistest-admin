"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export function SpeakingPart2Editor({
  topic,
  setTopic,
  points,
  setPoints,
}: {
  topic: string;
  setTopic: (v: string) => void;
  points: string[];
  setPoints: (v: string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="font-medium text-amber-900">Part 2: 큐카드 발표</p>
        <p className="text-sm text-amber-700 mt-1">주어진 주제에 대해 1분 준비 후 1~2분간 발표</p>
      </div>

      <div className="space-y-2">
        <RequiredLabel>큐카드 주제</RequiredLabel>
        <RichTextEditor
          value={topic}
          onChange={setTopic}
          placeholder="예: Describe a book that you have recently read."
          minHeight="60px"
        />
      </div>

      <div className="space-y-3">
        <Label>You should say: (포인트)</Label>
        {points.map((point, index) => (
          <Input
            key={index}
            value={point}
            onChange={(e) => {
              const newPoints = [...points];
              newPoints[index] = e.target.value;
              setPoints(newPoints);
            }}
            placeholder={`포인트 ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
