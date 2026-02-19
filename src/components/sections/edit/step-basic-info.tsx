"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Eye, X } from "lucide-react";
import { sanitizeHtmlForDisplay } from "@/lib/utils/sanitize";

interface StepBasicInfoProps {
  sectionType: string;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  timeLimit: string;
  setTimeLimit: (v: string) => void;
  isPractice: boolean;
  setIsPractice: (v: boolean) => void;
  instructionTitle: string;
  setInstructionTitle: (v: string) => void;
  instructionHtml: string;
  setInstructionHtml: (v: string) => void;
}

export function StepBasicInfo({
  sectionType,
  title,
  setTitle,
  description,
  setDescription,
  timeLimit,
  setTimeLimit,
  isPractice,
  setIsPractice,
  instructionTitle,
  setInstructionTitle,
  instructionHtml,
  setInstructionHtml,
}: StepBasicInfoProps) {
  const [showInstructionPreview, setShowInstructionPreview] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            목록에 표시되는 시험의 기본 정보입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>시험명 <span className="text-red-500">*</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: Reading Passage 1"
            />
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="시험 설명..."
              minHeight="80px"
            />
          </div>
          <div className="space-y-2">
            <Label>제한 시간 (분)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="예: 20"
              maxLength={3}
              value={timeLimit}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^[1-9]\d{0,2}$/.test(v)) {
                  setTimeLimit(v);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Right: 연습 섹션 + 안내 페이지 */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>연습 시험</Label>
                <p className="text-xs text-muted-foreground">
                  연습용 시험으로 표시됩니다.
                </p>
              </div>
              <Switch checked={isPractice} onCheckedChange={setIsPractice} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>안내 페이지</CardTitle>
                <CardDescription>
                  시험 시작 시 학생에게 처음 보여지는 안내 내용입니다. {sectionType === "speaking" ? "(필수)" : "(선택)"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructionPreview(true)}
                disabled={!instructionTitle && !instructionHtml}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                미리보기
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>안내 제목 {sectionType === "speaking" && <span className="text-red-500">*</span>}</Label>
              <Input
                value={instructionTitle}
                onChange={(e) => setInstructionTitle(e.target.value)}
                placeholder="예: Reading Test Instructions"
              />
            </div>
            <div className="space-y-2">
              <Label>안내 내용 {sectionType === "speaking" && <span className="text-red-500">*</span>}</Label>
              <RichTextEditor
                value={instructionHtml}
                onChange={setInstructionHtml}
                placeholder="시험 안내 내용..."
                minHeight="120px"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 안내 페이지 미리보기 */}
      <Dialog open={showInstructionPreview} onOpenChange={setShowInstructionPreview}>
        <DialogContent className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !gap-0 !inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 flex flex-col overflow-hidden [&>button]:hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white shrink-0">
            <DialogTitle className="text-sm font-semibold">안내 페이지 미리보기</DialogTitle>
            <button
              type="button"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
              onClick={() => setShowInstructionPreview(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex items-start justify-center p-8 bg-slate-200">
            <div className="bg-white rounded-lg border shadow-sm max-w-2xl w-full p-8 space-y-4">
              {instructionTitle && (
                <h2 className="text-xl font-bold text-center">{instructionTitle}</h2>
              )}
              {instructionHtml && (
                <div
                  className="prose prose-sm max-w-none [&_p]:my-2 [&_p:empty]:min-h-[1em] [&_p:has(br:only-child)]:min-h-[1em]"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(instructionHtml) }}
                />
              )}
              <div className="flex justify-center pt-4">
                <div className="px-6 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium">
                  Start
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
