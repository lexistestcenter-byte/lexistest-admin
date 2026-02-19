"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export function SpeakingPart2EditorEdit({
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

      <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
        <div className="bg-amber-100 px-4 py-2 border-b border-amber-200">
          <p className="text-sm font-semibold text-amber-800">큐카드 내용</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <RequiredLabel>주제</RequiredLabel>
            <RichTextEditor
              value={topic}
              onChange={setTopic}
              placeholder="e.g. Describe a book that you have recently read."
              minHeight="80px"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>You should say: (포인트)</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setPoints([...points, ""])}
                disabled={points.length >= 6}
              >
                <Plus className="h-3 w-3 mr-1" />
                포인트 추가
              </Button>
            </div>
            {points.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{index + 1}.</span>
                <Input
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[index] = e.target.value;
                    setPoints(newPoints);
                  }}
                  placeholder={`포인트 ${index + 1}`}
                  className="flex-1"
                />
                {points.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setPoints(points.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
