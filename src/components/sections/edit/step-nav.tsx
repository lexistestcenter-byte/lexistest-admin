"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { TOTAL_STEPS } from "./types";

interface StepNavProps {
  currentStep: number;
  isSaving: boolean;
  handlePrev: () => void;
  handleNext: () => void;
  handleSave: () => void;
}

export function StepNav({ currentStep, isSaving, handlePrev, handleNext, handleSave }: StepNavProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
      <Button
        variant="outline"
        onClick={handlePrev}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        이전
      </Button>

      <div className="text-sm text-muted-foreground font-medium">
        {currentStep} / {TOTAL_STEPS}
      </div>

      {currentStep < TOTAL_STEPS ? (
        <Button onClick={handleNext}>
          다음
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              저장
            </>
          )}
        </Button>
      )}
    </div>
  );
}
