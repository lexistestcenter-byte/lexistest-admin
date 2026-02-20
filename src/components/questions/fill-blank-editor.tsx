"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, List, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Blank } from "@/components/questions/types";

// =============================================================================
// 빈칸채우기 에디터 (직접입력)
// =============================================================================

interface FillBlankEditorProps {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  blanks: Blank[];
  setBlanks: (v: Blank[]) => void;
  blankMode: "word" | "sentence";
  setBlankMode: (v: "word" | "sentence") => void;
}

export function FillBlankEditor({
  title, setTitle, content, setContent, blanks, setBlanks, blankMode, setBlankMode,
}: FillBlankEditorProps) {
  const [editorContextMenu, setEditorContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const [expandedBlank, setExpandedBlank] = useState<string | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());

  const blanksRef = useRef(blanks);
  blanksRef.current = blanks;

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, orderedList: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setContent(html);
      const text = ed.state.doc.textContent;
      const foundNums: number[] = [];
      const re = /\[(\d+)\]/g;
      let match;
      while ((match = re.exec(text)) !== null) foundNums.push(parseInt(match[1]));
      const seen = new Set<number>();
      const duplicates = new Set<number>();
      for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
      if (duplicates.size > 0) {
        toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]. 같은 번호를 여러 번 사용할 수 없습니다.`);
      }
      const uniqueNums = [...new Set(foundNums)];
      const curr = blanksRef.current;
      let updated = [...curr];
      let changed = false;
      for (const num of uniqueNums) {
        if (!updated.some(b => b.number === num)) {
          const answer = pendingAnswers.current.get(num) || "";
          pendingAnswers.current.delete(num);
          updated.push({ id: `b${Date.now()}-${num}`, number: num, answer, alternatives: [] });
          changed = true;
        }
      }
      const before = updated.length;
      updated = updated.filter(b => uniqueNums.includes(b.number));
      if (updated.length !== before) changed = true;
      updated.sort((a, b) => a.number - b.number);
      if (changed) setBlanks(updated);
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

  const handleEditorContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) return;
    const trimmed = selectedText.trim();
    if (trimmed !== selectedText) {
      toast.warning("선택한 텍스트의 앞뒤에 공백이 포함되어 있습니다. 공백 없이 선택해주세요.");
      return;
    }
    setEditorContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromEditorSelection = () => {
    if (!editorContextMenu || !editor) return;
    const { text, from, to } = editorContextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
    setEditorContextMenu(null);
  };

  const removeBlankAndRestore = (id: string) => {
    const blank = blanks.find(b => b.id === id);
    if (!blank || !editor) return;
    const html = editor.getHTML();
    const newHtml = html.replace(`[${blank.number}]`, blank.answer || "");
    editor.commands.setContent(newHtml);
  };

  const updateBlankAnswer = (id: string, newAnswer: string) => {
    const clean = newAnswer.trim();
    setBlanks(blanks.map(b => b.id === id ? { ...b, answer: clean } : b));
  };

  const updateBlankAlternatives = (id: string, alternatives: string[]) => {
    setBlanks(blanks.map(b => b.id === id ? { ...b, alternatives } : b));
  };

  return (
    <div className="space-y-6" onClick={() => setEditorContextMenu(null)}>
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="지문 제목" />
      </div>

      <div className="space-y-2">
        <Label>문제 <span className="text-red-500">*</span></Label>
        <p className="text-xs text-muted-foreground">
          텍스트를 드래그로 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
        </p>
        <div className="relative">
          <div className="border rounded-md overflow-hidden" onContextMenu={handleEditorContextMenu}>
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
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`h-8 w-8 p-0 ${editor?.isActive("bulletList") ? "bg-slate-200" : ""}`}
              ><List className="h-4 w-4" /></Button>
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
          {editorContextMenu && createPortal(
            <div className="fixed z-[9999] bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ left: editorContextMenu.x, top: editorContextMenu.y }}
              onClick={(e) => e.stopPropagation()}>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                onClick={createBlankFromEditorSelection}>
                <Plus className="h-4 w-4" />
                빈칸 만들기: &ldquo;{editorContextMenu.text.length > 20 ? editorContextMenu.text.slice(0, 20) + "…" : editorContextMenu.text}&rdquo;
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>

      {blanks.length > 0 && (
        <div className="space-y-3">
          <Label>빈칸 정답 ({blanks.length}개)</Label>
          <div className="border rounded-lg divide-y">
            {blanks.map((blank) => (
              <div key={blank.id} className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{blank.number}</span>
                  <Input className="flex-1 h-8 text-sm" value={blank.answer}
                    onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                    placeholder="정답 입력" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedBlank(expandedBlank === blank.id ? null : blank.id)}
                    className="text-xs shrink-0"
                  >
                    {expandedBlank === blank.id ? "접기" : `대체 ${blank.alternatives?.length || 0}`}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeBlankAndRestore(blank.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {expandedBlank === blank.id && (
                  <div className="ml-10 space-y-2 pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">대체 정답</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateBlankAlternatives(blank.id, [...(blank.alternatives || []), ""])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    </div>
                    {(blank.alternatives || []).map((alt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={alt}
                          onChange={(e) => {
                            const alts = [...(blank.alternatives || [])];
                            alts[i] = e.target.value;
                            updateBlankAlternatives(blank.id, alts);
                          }}
                          placeholder={`대체 정답 ${i + 1}`}
                          className="h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => updateBlankAlternatives(blank.id, (blank.alternatives || []).filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!blank.alternatives || blank.alternatives.length === 0) && (
                      <p className="text-xs text-muted-foreground py-1">대체 정답이 없습니다. &quot;추가&quot; 버튼을 클릭하세요.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 빈칸채우기 드래그앤드랍 에디터 (TipTap + 우클릭 빈칸 생성)
// =============================================================================

interface FillBlankDragEditorProps {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  blanks: Blank[];
  setBlanks: (v: Blank[]) => void;
  wordBank: string[];
  setWordBank: (v: string[]) => void;
  blankMode: "word" | "sentence";
  setBlankMode: (v: "word" | "sentence") => void;
  allowDuplicate: boolean;
  setAllowDuplicate: (v: boolean) => void;
}

export function FillBlankDragEditor({
  title, setTitle, content, setContent, blanks, setBlanks, wordBank, setWordBank, blankMode, setBlankMode, allowDuplicate, setAllowDuplicate,
}: FillBlankDragEditorProps) {
  const [editorContextMenu, setEditorContextMenu] = useState<{ x: number; y: number; text: string; from: number; to: number } | null>(null);
  const [expandedBlank, setExpandedBlank] = useState<string | null>(null);
  const pendingAnswers = useRef<Map<number, string>>(new Map());

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const blanksRef = useRef(blanks);
  const wordBankRef = useRef(wordBank);
  blanksRef.current = blanks;
  wordBankRef.current = wordBank;

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, orderedList: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setContent(html);
      const text = ed.state.doc.textContent;
      const foundNums: number[] = [];
      const re = /\[(\d+)\]/g;
      let match;
      while ((match = re.exec(text)) !== null) foundNums.push(parseInt(match[1]));
      const seen = new Set<number>();
      const duplicates = new Set<number>();
      for (const n of foundNums) { if (seen.has(n)) duplicates.add(n); seen.add(n); }
      if (duplicates.size > 0) {
        toast.warning(`중복된 빈칸 번호가 있습니다: [${[...duplicates].join("], [")}]. 같은 번호를 여러 번 사용할 수 없습니다.`);
      }
      const uniqueNums = [...new Set(foundNums)];
      const curr = blanksRef.current;
      let updated = [...curr];
      let changed = false;
      for (const num of uniqueNums) {
        if (!updated.some(b => b.number === num)) {
          const answer = pendingAnswers.current.get(num) || "";
          pendingAnswers.current.delete(num);
          updated.push({ id: `b${Date.now()}-${num}`, number: num, answer, alternatives: [] });
          changed = true;
        }
      }
      const before = updated.length;
      const removed = updated.filter(b => !uniqueNums.includes(b.number));
      updated = updated.filter(b => uniqueNums.includes(b.number));
      if (updated.length !== before) {
        changed = true;
        const remainingAnswers = new Set(updated.map(b => b.answer).filter(Boolean));
        const toRemove = removed.map(b => b.answer).filter(a => a && !remainingAnswers.has(a));
        if (toRemove.length > 0) setWordBank(wordBankRef.current.filter(w => !toRemove.includes(w)));
      }
      updated.sort((a, b) => a.number - b.number);
      if (changed) setBlanks(updated);
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

  const handleEditorContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) return;
    const trimmed = selectedText.trim();
    if (trimmed !== selectedText) {
      toast.warning("선택한 텍스트의 앞뒤에 공백이 포함되어 있습니다. 공백 없이 선택해주세요.");
      return;
    }
    setEditorContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, from, to });
  };

  const createBlankFromEditorSelection = () => {
    if (!editorContextMenu || !editor) return;
    const { text, from, to } = editorContextMenu;
    const nums = blanks.map(b => b.number);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    pendingAnswers.current.set(nextNum, text);
    editor.chain().focus().deleteRange({ from, to }).insertContent(`[${nextNum}]`).run();
    const trimmed = text.trim();
    if (trimmed && !wordBank.includes(trimmed)) setWordBank([...wordBank, trimmed]);
    setEditorContextMenu(null);
  };

  const removeBlankAndRestore = (id: string) => {
    const blank = blanks.find(b => b.id === id);
    if (!blank || !editor) return;
    const html = editor.getHTML();
    const newHtml = html.replace(`[${blank.number}]`, blank.answer || "");
    editor.commands.setContent(newHtml);
  };

  const updateBlankAnswer = (id: string, newAnswer: string) => {
    const clean = newAnswer.trim();
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;
    const oldAnswer = blank.answer;
    setBlanks(blanks.map(b => b.id === id ? { ...b, answer: clean } : b));
    const wbWord = clean;
    if (oldAnswer && oldAnswer !== clean) {
      const stillUsed = blanks.some(b => b.id !== id && b.answer === oldAnswer);
      let wb = [...wordBankRef.current];
      if (!stillUsed) wb = wb.filter(w => w !== oldAnswer);
      if (wbWord && !wb.includes(wbWord)) wb.push(wbWord);
      setWordBank(wb);
    } else if (wbWord && !wordBankRef.current.includes(wbWord)) {
      setWordBank([...wordBankRef.current, wbWord]);
    }
  };

  const updateBlankAlternatives = (id: string, alternatives: string[]) => {
    setBlanks(blanks.map(b => b.id === id ? { ...b, alternatives } : b));
  };

  return (
    <div className="space-y-6" onClick={() => setEditorContextMenu(null)}>
      <div className="space-y-2">
        <Label>제목 (선택)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="지문 제목" />
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
        <span className="text-sm text-muted-foreground">중복 단어 허용</span>
        <Switch checked={allowDuplicate} onCheckedChange={setAllowDuplicate} />
      </div>

      <div className="space-y-2">
        <Label>문제 <span className="text-red-500">*</span></Label>
        <p className="text-xs text-muted-foreground">
          텍스트를 드래그로 선택 후 <strong>우클릭</strong> → 빈칸 만들기 / 직접 <code className="bg-slate-100 px-1 rounded">[번호]</code> 입력도 가능
        </p>
        <div className="relative">
          <div className="border rounded-md overflow-hidden" onContextMenu={handleEditorContextMenu}>
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
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`h-8 w-8 p-0 ${editor?.isActive("bulletList") ? "bg-slate-200" : ""}`}
              ><List className="h-4 w-4" /></Button>
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
          {editorContextMenu && createPortal(
            <div className="fixed z-[9999] bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ left: editorContextMenu.x, top: editorContextMenu.y }}
              onClick={(e) => e.stopPropagation()}>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                onClick={createBlankFromEditorSelection}>
                <Plus className="h-4 w-4" />
                빈칸 만들기: &ldquo;{editorContextMenu.text.length > 20 ? editorContextMenu.text.slice(0, 20) + "…" : editorContextMenu.text}&rdquo;
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>

      {blanks.length > 0 && (
        <div className="space-y-3">
          <Label>빈칸 목록 ({blanks.length}개)</Label>
          <div className="border rounded-lg divide-y">
            {blanks.map((blank) => (
              <div key={blank.id} className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{blank.number}</span>
                  <Input className="flex-1 h-8 text-sm" value={blank.answer}
                    onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                    placeholder="정답 단어 입력" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedBlank(expandedBlank === blank.id ? null : blank.id)}
                    className="text-xs shrink-0"
                  >
                    {expandedBlank === blank.id ? "접기" : `대체 ${blank.alternatives?.length || 0}`}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeBlankAndRestore(blank.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {expandedBlank === blank.id && (
                  <div className="ml-10 space-y-2 pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">대체 정답</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateBlankAlternatives(blank.id, [...(blank.alternatives || []), ""])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    </div>
                    {(blank.alternatives || []).map((alt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={alt}
                          onChange={(e) => {
                            const alts = [...(blank.alternatives || [])];
                            alts[i] = e.target.value;
                            updateBlankAlternatives(blank.id, alts);
                          }}
                          placeholder={`대체 정답 ${i + 1}`}
                          className="h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => updateBlankAlternatives(blank.id, (blank.alternatives || []).filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!blank.alternatives || blank.alternatives.length === 0) && (
                      <p className="text-xs text-muted-foreground py-1">대체 정답이 없습니다. &quot;추가&quot; 버튼을 클릭하세요.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {wordBank.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Word Bank 미리보기</Label>
            <span className="text-[10px] text-muted-foreground">(드래그하여 순서 변경)</span>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-dashed">
            {wordBank.map((word, i) => {
              const isAnswer = blanks.some(b => b.answer === word);
              return (
                <span key={`${i}-${word}`} draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  onDrop={() => {
                    if (dragIdx === null || dragIdx === i) return;
                    const r = [...wordBank]; const [mv] = r.splice(dragIdx, 1); r.splice(i, 0, mv);
                    setWordBank(r); setDragIdx(null); setDragOverIdx(null);
                  }}
                  className={`px-3 py-1 rounded-md text-sm border cursor-grab active:cursor-grabbing select-none transition-all ${dragIdx === i ? "opacity-40 scale-95" : ""} ${dragOverIdx === i && dragIdx !== i ? "ring-2 ring-primary ring-offset-1" : ""} ${isAnswer ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
