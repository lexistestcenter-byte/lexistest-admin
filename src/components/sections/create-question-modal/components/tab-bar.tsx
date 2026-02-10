"use client";

import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TabState, getTabLabel } from "../types";

interface TabBarProps {
  tabs: TabState[];
  activeTabIdx: number;
  setActiveTabIdx: (idx: number) => void;
  removeTab: (idx: number) => void;
  addTab: () => void;
  isSaving: boolean;
  tabSaved: boolean;
  handleSave: () => void;
}

export function TabBar({
  tabs, activeTabIdx, setActiveTabIdx,
  removeTab, addTab, isSaving, tabSaved, handleSave,
}: TabBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 border-b overflow-x-auto shrink-0">
      {tabs.map((t, idx) => {
        const isActive = idx === activeTabIdx;
        const label = t.selectedFormat
          ? getTabLabel(t)
          : `문제 ${idx + 1}`;
        return (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-sm cursor-pointer transition-colors border border-b-0 shrink-0",
              isActive
                ? "bg-white text-foreground font-medium border-slate-300"
                : "bg-slate-200 text-muted-foreground hover:bg-slate-50 border-transparent"
            )}
            onClick={() => setActiveTabIdx(idx)}
          >
            {t.saved && (
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
            )}
            <span className="truncate max-w-[100px]">{label}</span>
            {tabs.length > 1 && (
              <button
                className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded"
                onClick={(e) => { e.stopPropagation(); removeTab(idx); }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
        onClick={addTab}
        title="새 문제 탭 추가"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 저장 버튼 — 탭 바 맨 오른쪽 */}
      <div className="ml-auto shrink-0">
        <Button onClick={handleSave} disabled={isSaving || tabSaved} size="sm">
          {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          저장
        </Button>
      </div>
    </div>
  );
}
