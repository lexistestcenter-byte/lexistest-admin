"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RequiredLabel } from "@/components/ui/required-label";
import type { TabState } from "../types";

interface ModalSpeakingPart2EditorProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
}

export function ModalSpeakingPart2Editor({ tab, updateTab }: ModalSpeakingPart2EditorProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="font-medium text-amber-900">Part 2: Cue Card</p>
        <p className="text-sm text-amber-700 mt-1">
          The candidate prepares for {tab.prepTimeSeconds || 60}s, then speaks for up to {tab.speakingTimeSeconds || 120}s on the given topic.
        </p>
      </div>

      {/* Cue Card Content */}
      <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
        <div className="bg-amber-100 px-4 py-2 border-b border-amber-200">
          <p className="text-sm font-semibold text-amber-800">Cue Card Content</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <RequiredLabel>Topic</RequiredLabel>
            <RichTextEditor
              value={tab.cueCardTopic}
              onChange={(v) => updateTab({ cueCardTopic: v })}
              placeholder="e.g. Describe a book that you have recently read."
              minHeight="80px"
              />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>You should say:</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => updateTab({ cueCardPoints: [...tab.cueCardPoints, ""] })}
                disabled={tab.saved || tab.cueCardPoints.length >= 6}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Point
              </Button>
            </div>
            {tab.cueCardPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{index + 1}.</span>
                <Input
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...tab.cueCardPoints];
                    newPoints[index] = e.target.value;
                    updateTab({ cueCardPoints: newPoints });
                  }}
                  placeholder={`Point ${index + 1}`}
                  disabled={tab.saved}
                  className="flex-1"
                />
                {tab.cueCardPoints.length > 1 && !tab.saved && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      const newPoints = tab.cueCardPoints.filter((_, i) => i !== index);
                      updateTab({ cueCardPoints: newPoints });
                    }}
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
