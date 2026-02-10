"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { TabState } from "../types";

interface ModalMatchingEditorProps {
  tab: TabState;
  updateTab: (updates: Partial<TabState>) => void;
  addMatchingOption: () => void;
  removeMatchingOption: (id: string) => void;
  addMatchingItem: () => void;
  removeMatchingItem: (id: string) => void;
}

export function ModalMatchingEditor({
  tab, updateTab,
  addMatchingOption, removeMatchingOption,
  addMatchingItem, removeMatchingItem,
}: ModalMatchingEditorProps) {
  return (
    <div className="space-y-6">
      {/* 지문 입력 */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label>문제 제목</Label>
          <Input value={tab.matchingTitle} onChange={(e) => updateTab({ matchingTitle: e.target.value })} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" disabled={tab.saved} />
        </div>
        <div className="space-y-2">
          <Label>문제 내용 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">
            섹션 시작 위치에 <code className="bg-slate-100 px-1 rounded">[번호]</code> 형식으로 마커를 입력하세요.
          </p>
          <RichTextEditor value={tab.matchingContent} onChange={(v) => updateTab({ matchingContent: v })} placeholder="지문 내용을 입력하세요..." minHeight="200px" />
        </div>
      </div>

      {/* 제목 목록 */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>제목 목록 (List of Headings) <span className="text-red-500">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5">정답 제목과 오답(함정) 제목을 모두 추가하세요.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addMatchingOption} disabled={tab.saved}>
            <Plus className="h-4 w-4 mr-1" />
            제목 추가
          </Button>
        </div>
        <div className="border rounded-lg divide-y">
          {tab.matchingOptions.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 px-3 py-2">
              <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                {opt.label}
              </span>
              <Input
                className="flex-1 h-8 text-sm"
                value={opt.text}
                onChange={(e) => updateTab({ matchingOptions: tab.matchingOptions.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })}
                placeholder={`제목 ${opt.label} 입력`}
                disabled={tab.saved}
              />
              {tab.matchingOptions.length > 2 && !tab.saved && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeMatchingOption(opt.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 문항 (섹션-제목 매핑) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>문항 <span className="text-red-500">*</span></Label>
            <Button variant="outline" size="sm" onClick={addMatchingItem} disabled={tab.saved}>
              <Plus className="h-4 w-4 mr-1" /> 문항 추가
            </Button>
          </div>
          <div className="border rounded-lg divide-y">
            {tab.matchingItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                <span className="w-5 text-right font-bold text-muted-foreground shrink-0">{item.number}</span>
                <Input
                  className="flex-1 h-8 text-sm"
                  value={item.statement}
                  onChange={(e) => updateTab({ matchingItems: tab.matchingItems.map((i) => (i.id === item.id ? { ...i, statement: e.target.value } : i)) })}
                  placeholder="문항 내용"
                  disabled={tab.saved}
                />
                <Select
                  value={item.correctLabel}
                  onValueChange={(v) => updateTab({ matchingItems: tab.matchingItems.map((i) => (i.id === item.id ? { ...i, correctLabel: v } : i)) })}
                  disabled={tab.saved}
                >
                  <SelectTrigger className="w-20 h-8 text-xs shrink-0">
                    <SelectValue placeholder="정답" />
                  </SelectTrigger>
                  <SelectContent>
                    {tab.matchingOptions.map((o) => (
                      <SelectItem key={o.label} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tab.matchingItems.length > 1 && !tab.saved && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeMatchingItem(item.id)}>
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
