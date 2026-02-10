"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigatorProps {
  totalItems: number;
  activeNum: number;
  setActiveNum: (num: number | ((prev: number) => number)) => void;
  answers: Record<number, string>;
}

export function Navigator({ totalItems, activeNum, setActiveNum, answers }: NavigatorProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 shrink-0">
      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
        {Array.from({ length: totalItems }, (_, i) => i + 1).map((num) => {
          const isAct = num === activeNum;
          const isAnswered = Boolean(answers[num]);
          return (
            <button
              key={num}
              type="button"
              onClick={() => setActiveNum(num)}
              className={cn(
                "h-7 min-w-[28px] px-1 rounded text-xs font-mono font-bold border transition-colors",
                isAct
                  ? "bg-white text-blue-600 border-blue-400 shadow"
                  : isAnswered
                    ? "bg-slate-500 text-white border-slate-500"
                    : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
              )}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white hover:bg-slate-700"
          disabled={activeNum <= 1}
          onClick={() => setActiveNum((p) => Math.max(1, p - 1))}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white hover:bg-slate-700"
          disabled={activeNum >= totalItems}
          onClick={() => setActiveNum((p) => Math.min(totalItems, p + 1))}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
