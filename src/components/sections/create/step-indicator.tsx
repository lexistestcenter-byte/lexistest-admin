"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOTAL_STEPS, STEP_LABELS } from "./types";

interface StepIndicatorProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  validateStep: (step: number) => boolean;
}

export function StepIndicator({
  currentStep,
  setCurrentStep,
  validateStep,
}: StepIndicatorProps) {
  return (
    <div>
      <div className="flex items-center justify-center gap-0">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = currentStep > step;
          const isCurrent = currentStep === step;
          return (
            <div key={step} className="flex items-center">
              {idx > 0 && (
                <div
                  className={cn(
                    "h-px w-12 sm:w-20",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (step === currentStep) return;
                  if (step < currentStep) {
                    setCurrentStep(step);
                  } else if (validateStep(currentStep)) {
                    setCurrentStep(step);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted &&
                    "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                  !isCurrent &&
                    !isCompleted &&
                    "text-muted-foreground cursor-pointer hover:text-foreground/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent && "bg-primary-foreground text-primary",
                    isCompleted && "bg-primary text-primary-foreground",
                    !isCurrent &&
                      !isCompleted &&
                      "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
