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
}

export function ModalMatchingEditor({
  tab, updateTab,
  addMatchingOption, removeMatchingOption,
}: ModalMatchingEditorProps) {
  // 지문에서 [N] 섹션 번호 파싱
  const sectionNums = (() => {
    const text = tab.matchingContent.replace(/<[^>]*>/g, "");
    const nums: number[] = [];
    const re = /\[(\d+)\]/g;
    let m;
    while ((m = re.exec(text)) !== null) nums.push(parseInt(m[1]));
    return [...new Set(nums)].sort((a, b) => a - b);
  })();
  return (
    <div className="space-y-6">
      {/* 지문 입력 */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label>지문 제목</Label>
          <Input value={tab.matchingTitle} onChange={(e) => updateTab({ matchingTitle: e.target.value })} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" disabled={tab.saved} />
        </div>
        <div className="space-y-2">
          <Label>지문 내용 <span className="text-red-500">*</span></Label>
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
          {tab.matchingOptions.map((opt) => {
            const assignedSection = tab.matchingItems.find(i => i.correctLabel === opt.label)?.number ?? null;
            return (
              <div key={opt.id} className="flex items-center gap-2 px-3 py-2">
                <Input
                  className="w-10 h-8 text-center text-xs font-bold shrink-0 px-0"
                  value={opt.label}
                  onChange={(e) => {
                    const newLabel = e.target.value.slice(0, 4);
                    const oldLabel = opt.label;
                    updateTab({
                      matchingOptions: tab.matchingOptions.map((o) => (o.id === opt.id ? { ...o, label: newLabel } : o)),
                      ...(oldLabel !== newLabel ? { matchingItems: tab.matchingItems.map((i) => (i.correctLabel === oldLabel ? { ...i, correctLabel: newLabel } : i)) } : {}),
                    });
                  }}
                  disabled={tab.saved}
                />
                <Input
                  className="flex-1 h-8 text-sm"
                  value={opt.text}
                  onChange={(e) => updateTab({ matchingOptions: tab.matchingOptions.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })}
                  placeholder={`제목 ${opt.label} 입력`}
                  disabled={tab.saved}
                />
                <Select
                  value={assignedSection !== null ? String(assignedSection) : "__wrong__"}
                  onValueChange={(v) => {
                    let newItems = tab.matchingItems.filter(i => i.correctLabel !== opt.label);
                    if (v !== "__wrong__") {
                      const num = parseInt(v);
                      newItems = newItems.filter(i => i.number !== num);
                      newItems.push({ id: `m${Date.now()}`, number: num, statement: "", correctLabel: opt.label });
                    }
                    updateTab({ matchingItems: newItems });
                  }}
                  disabled={tab.saved}
                >
                  <SelectTrigger className="w-28 h-8 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__wrong__">오답</SelectItem>
                    {sectionNums.map((n) => (
                      <SelectItem key={n} value={String(n)}>섹션 [{n}]</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tab.matchingOptions.length > 2 && !tab.saved && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeMatchingOption(opt.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
