"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} 시험
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
            <CardTitle>안내 페이지</CardTitle>
            <CardDescription>
              시험 시작 전 표시될 안내 내용입니다. (선택)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>안내 제목</Label>
              <Input
                value={instructionTitle}
                onChange={(e) => setInstructionTitle(e.target.value)}
                placeholder="예: Reading Test Instructions"
              />
            </div>
            <div className="space-y-2">
              <Label>안내 내용</Label>
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
    </div>
  );
}
