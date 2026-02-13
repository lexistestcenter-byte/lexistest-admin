"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { ContentBlock } from "./types";

interface ContentBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create new block, existing = edit */
  block: ContentBlock | null;
  sectionType: string;
  sectionId: string;
  onSave: (data: Partial<ContentBlock>, existingId: string | null) => void;
}

export function ContentBlockModal({
  open,
  onOpenChange,
  block,
  sectionType,
  sectionId,
  onSave,
}: ContentBlockModalProps) {
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [localFootnotes, setLocalFootnotes] = useState("");
  const [localAudioUrl, setLocalAudioUrl] = useState("");

  // Sync local state when block changes or modal opens
  useEffect(() => {
    if (open) {
      setLocalTitle(block?.passage_title || "");
      setLocalContent(block?.passage_content || "");
      setLocalFootnotes(block?.passage_footnotes || "");
      setLocalAudioUrl(block?.audio_url || "");
    }
  }, [open, block]);

  const isAudio = sectionType === "listening";

  const handleSave = () => {
    const data: Partial<ContentBlock> = {
      passage_title: localTitle || null,
      passage_content: localContent || null,
      passage_footnotes: localFootnotes || null,
    };
    if (isAudio) {
      data.audio_url = localAudioUrl || null;
    }
    onSave(data, block?.id || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* ─── Top bar ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
          <DialogTitle className="text-sm font-semibold">
            {block ? "지문 편집" : "새 지문 추가"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-600 h-8"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="bg-white text-slate-700 hover:bg-slate-100 h-8"
              onClick={handleSave}
            >
              저장
            </Button>
            <button
              type="button"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Body: 2-column layout ─── */}
        <div className="flex-1 bg-slate-200 overflow-hidden grid grid-cols-2 min-h-0">
          {/* LEFT: Editor (content-panel style) */}
          <div className="col-span-1 border-r border-slate-300 bg-slate-100 overflow-y-auto">
            <div className="p-4 min-h-full flex flex-col">
              <div className="bg-white rounded-lg border p-6 flex-1 space-y-5">
                {/* Audio upload (listening only) */}
                {isAudio && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">오디오 파일</Label>
                    <FileUpload
                      value={localAudioUrl}
                      onChange={(url) => setLocalAudioUrl(url)}
                      accept="audio"
                      placeholder="오디오 파일 업로드"
                      context={`sections/${sectionId}`}
                    />
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">지문 제목</Label>
                  <Input
                    placeholder="예: The History of Glass"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    className="text-base font-bold"
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">지문 내용</Label>
                  <RichTextEditor
                    placeholder="지문 내용을 입력하세요..."
                    minHeight="340px"
                    value={localContent}
                    onChange={(val) => setLocalContent(val)}
                  />
                </div>

                {/* Footnotes */}
                <div className="space-y-1.5 pt-3 border-t">
                  <Label className="text-xs text-gray-500 italic">각주 (선택)</Label>
                  <RichTextEditor
                    placeholder="예: *calorie: a measure of the energy value of food"
                    minHeight="80px"
                    value={localFootnotes}
                    onChange={(val) => setLocalFootnotes(val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Dummy questions preview */}
          <div className="col-span-1 bg-slate-100 overflow-y-auto">
            <div className="p-4">
              <div className="bg-white rounded-lg border p-6 opacity-50 pointer-events-none select-none">
                <p className="text-sm font-bold text-gray-800 mb-1">Questions 1–4</p>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                  Choose the correct letter, A, B, C or D.
                </p>

                <DummyQuestion num={1} text="The main purpose of the passage is to..." />
                <DummyQuestion num={2} text="According to the author, the most significant factor was..." />
                <DummyQuestion num={3} text="The writer suggests that the process involved..." />
                <DummyQuestion num={4} text="What conclusion can be drawn from the passage?" />

                <div className="mt-8 border-t pt-4">
                  <p className="text-sm font-bold text-gray-800 mb-1">Questions 5–8</p>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                    Do the following statements agree with the information given in the passage?
                  </p>
                  <DummyTFNG num={5} text="The discovery was made in the early twentieth century." />
                  <DummyTFNG num={6} text="Initial experiments produced unexpected results." />
                  <DummyTFNG num={7} text="The technique was later adopted by other researchers." />
                  <DummyTFNG num={8} text="Funding for the project was reduced over time." />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Dummy question components ─── */

function DummyQuestion({ num, text }: { num: number; text: string }) {
  return (
    <div className="mb-5">
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-bold mr-1">{num}.</span>
        {text}
      </p>
      <div className="space-y-1.5 pl-4">
        <DummyOption label="A" text="describe a historical event" />
        <DummyOption label="B" text="explain a scientific process" />
        <DummyOption label="C" text="compare different theories" />
        <DummyOption label="D" text="argue for a specific viewpoint" />
      </div>
    </div>
  );
}

function DummyOption({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
      <span className="text-sm text-gray-500">{label}. {text}</span>
    </div>
  );
}

function DummyTFNG({ num, text }: { num: number; text: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-600 mb-1.5">
        <span className="font-bold mr-1">{num}.</span>
        {text}
      </p>
      <div className="flex gap-3 pl-4">
        {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
          <div key={opt} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
            <span className="text-xs text-gray-500">{opt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
