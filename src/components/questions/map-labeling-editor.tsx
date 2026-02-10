"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { MapLabelingItem } from "@/components/questions/types";

export function MapLabelingEditor({
  title,
  setTitle,
  passage,
  setPassage,
  labels,
  setLabels,
  items,
  setItems,
  disabled,
}: {
  title: string;
  setTitle: (v: string) => void;
  passage: string;
  setPassage: (v: string) => void;
  labels: string[];
  setLabels: (v: string[]) => void;
  items: MapLabelingItem[];
  setItems: (v: MapLabelingItem[]) => void;
  disabled?: boolean;
}) {
  // 라벨 개수 변경 시 A~N 자동 생성
  const handleLabelCountChange = (count: number) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newLabels = Array.from({ length: count }, (_, i) => alphabet[i]);
    setLabels(newLabels);
    // 기존 정답이 새 라벨 범위 밖이면 클리어
    setItems(items.map(item =>
      !newLabels.includes(item.correctLabel) ? { ...item, correctLabel: "" } : item
    ));
  };

  const addItem = () => {
    const nextNum = items.length > 0 ? Math.max(...items.map(i => i.number)) + 1 : 1;
    setItems([...items, { id: `ml${Date.now()}`, number: nextNum, statement: "", correctLabel: "" }]);
  };

  const updateItem = (id: string, field: keyof MapLabelingItem, value: unknown) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("최소 1개의 문제 항목이 필요합니다.");
      return;
    }
    const filtered = items.filter(item => item.id !== id);
    // 번호 재정렬
    setItems(filtered.map((item, idx) => ({ ...item, number: idx + 1 })));
  };

  return (
    <div className="space-y-4">
      {/* 제목 + 지문 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>제목 <span className="text-red-500">*</span></Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: Map of Shopping Centre"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>지문 (선택)</Label>
          <RichTextEditor
            value={passage}
            onChange={setPassage}
            placeholder="지도에 대한 설명 텍스트 (선택사항)"
            minHeight="60px"
            />
        </div>
      </div>

      {/* 라벨 설정 + 테이블 */}
      <div className="space-y-3">
        {/* 라벨 개수 설정 */}
        <div className="flex items-center gap-3">
          <Label className="shrink-0">라벨 개수</Label>
          <Select
            value={String(labels.length)}
            onValueChange={(v) => handleLabelCountChange(parseInt(v))}
            disabled={disabled}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}개 (A~{"ABCDEFGHIJ"[n - 1]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 문제 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium">건물/장소명</th>
                {labels.map((label) => (
                  <th key={label} className="px-1 py-2 text-center font-medium w-12">{label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground shrink-0 w-5 text-right">{item.number}</span>
                      <Input
                        className="h-8 text-sm min-w-[200px]"
                        value={item.statement}
                        onChange={(e) => updateItem(item.id, "statement", e.target.value)}
                        placeholder="예: Quilt Shop"
                        disabled={disabled}
                      />
                    </div>
                  </td>
                  {labels.map((label) => (
                    <td key={label} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                          "w-9 h-9 rounded border-2 flex items-center justify-center transition-colors mx-auto",
                          item.correctLabel === label
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        onClick={() => updateItem(item.id, "correctLabel", item.correctLabel === label ? "" : label)}
                      >
                        {item.correctLabel === label && "✓"}
                      </button>
                    </td>
                  ))}
                  <td className="px-1 py-1.5">
                    {items.length > 1 && !disabled && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 행 추가 버튼 */}
        {!disabled && (
          <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            문제 추가
          </Button>
        )}
      </div>
    </div>
  );
}
