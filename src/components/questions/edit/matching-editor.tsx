"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Bold, Italic, AlignLeft, AlignCenter, AlignRight, X } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import type { MatchingOption, MatchingItem } from "@/components/questions/types";

export function MatchingEditor({
  title, setTitle, content, setContent,
  allowDuplicate, setAllowDuplicate,
  options, addOption, removeOption, updateOption, updateOptionLabel,
  items, setItems,
  addItem, updateItem, removeItem,
}: {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  allowDuplicate: boolean; setAllowDuplicate: (v: boolean) => void;
  options: MatchingOption[];
  addOption: () => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, text: string) => void;
  updateOptionLabel: (id: string, label: string) => void;
  items: MatchingItem[]; setItems: (v: MatchingItem[]) => void;
  addItem: () => void;
  updateItem: (id: string, field: keyof MatchingItem, value: unknown) => void;
  removeItem: (id: string) => void;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // 지문에서 [N] 섹션 번호 파싱
  const sectionNums = (() => {
    const text = content.replace(/<[^>]*>/g, "");
    const nums: number[] = [];
    const re = /\[(\d+)\]/g;
    let m;
    while ((m = re.exec(text)) !== null) nums.push(parseInt(m[1]));
    return [...new Set(nums)].sort((a, b) => a - b);
  })();

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      // [N] 삭제 시 해당 항목 정리
      const text = editor.state.doc.textContent;
      const re = /\[(\d+)\]/g;
      const foundNums = new Set<number>();
      let match;
      while ((match = re.exec(text)) !== null) foundNums.add(parseInt(match[1]));
      const curr = itemsRef.current;
      const filtered = curr.filter(i => foundNums.has(i.number));
      if (filtered.length !== curr.length) setItems(filtered);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2 [&_p]:my-1 [&_strong]:font-bold",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editor) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const insertSectionMarker = () => {
    if (!editor) return;
    const nextNum = sectionNums.length > 0 ? Math.max(...sectionNums) + 1 : 1;
    editor.chain().focus().insertContent(`[${nextNum}]`).run();
    setContextMenu(null);
  };

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>
      {/* ── 지문 입력 ── */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label>지문 제목</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: The Physics of Traffic Behavior" className="text-lg font-medium" />
        </div>
        <div className="space-y-2">
          <Label>지문 내용 <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">
            섹션 시작 위치에서 <strong>우클릭</strong> → 섹션 마커 삽입 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
          </p>
          <p className="text-xs text-muted-foreground">
            문제 내용은 왼쪽에 표시 됩니다.
          </p>
          <div className="relative">
            <div className="border rounded-md overflow-hidden" onContextMenu={handleContextMenu}>
              <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("bold") ? "bg-slate-200" : ""}`}
                ><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive("italic") ? "bg-slate-200" : ""}`}
                ><Italic className="h-4 w-4" /></Button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: "left" }) ? "bg-slate-200" : ""}`}
                ><AlignLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: "center" }) ? "bg-slate-200" : ""}`}
                ><AlignCenter className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                  className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: "right" }) ? "bg-slate-200" : ""}`}
                ><AlignRight className="h-4 w-4" /></Button>
              </div>
              <EditorContent editor={editor} className="bg-white" />
            </div>
            {contextMenu && (
              <div className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[180px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                  onClick={insertSectionMarker}>
                  <Plus className="h-4 w-4" />
                  섹션 마커 삽입 [{sectionNums.length > 0 ? Math.max(...sectionNums) + 1 : 1}]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 제목 목록 (List of Headings) ── */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>제목 목록 (List of Headings) <span className="text-red-500">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5">정답 제목과 오답(함정) 제목을 모두 추가하세요.</p>
            <p className="text-xs text-muted-foreground mt-0.5">제목 목록은 오른쪽에 표시되는 내용 입니다.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            제목 추가
          </Button>
        </div>
        <div className="border rounded-lg divide-y">
          {options.map((option) => (
            <div key={option.id} className="flex items-center gap-2 px-3 py-2">
              <Input
                className="w-10 h-8 text-center text-xs font-bold shrink-0 px-0"
                value={option.label}
                onChange={(e) => updateOptionLabel(option.id, e.target.value.slice(0, 4))}
              />
              <Input className="flex-1 h-8 text-sm" value={option.text} onChange={(e) => updateOption(option.id, e.target.value)} placeholder={`제목 ${option.label} 입력`} />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeOption(option.id)}>
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <Switch checked={allowDuplicate} onCheckedChange={setAllowDuplicate} />
          <Label className="text-xs text-muted-foreground">같은 제목 중복 사용 허용</Label>
        </div>
      </div>

      {/* ── 문항 (Items) ── */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>문항 <span className="text-red-500">*</span></Label>
            <p className="text-xs text-muted-foreground mt-0.5">각 문항의 내용과 정답 라벨을 지정하세요.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            문항 추가
          </Button>
        </div>
        <div className="border rounded-lg divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-2">
              <span className="w-5 text-right font-bold text-muted-foreground shrink-0">{item.number}</span>
              <Input
                className="flex-1 h-8 text-sm"
                value={item.statement}
                onChange={(e) => updateItem(item.id, "statement", e.target.value)}
                placeholder="문항 내용"
              />
              <Select
                value={item.correctLabel}
                onValueChange={(v) => updateItem(item.id, "correctLabel", v)}
              >
                <SelectTrigger className="w-20 h-8 text-xs shrink-0">
                  <SelectValue placeholder="정답" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.label} value={o.label}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {items.length > 1 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(item.id)}>
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
