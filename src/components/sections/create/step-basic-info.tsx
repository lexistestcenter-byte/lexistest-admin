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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FileUpload } from "@/components/ui/file-upload";

interface StepBasicInfoProps {
  sectionType: string;
  onSectionTypeChange: (v: string) => void;
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
  instructionAudioUrl: string;
  setInstructionAudioUrl: (v: string) => void;
  instructionAudioFile: File | null;
  setInstructionAudioFile: (v: File | null) => void;
}

export function StepBasicInfo({
  sectionType,
  onSectionTypeChange,
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
  instructionAudioUrl,
  setInstructionAudioUrl,
  instructionAudioFile,
  setInstructionAudioFile,
}: StepBasicInfoProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>목록에 표시되는 시험의 기본 정보입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              시험 과목 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={sectionType}
              onValueChange={onSectionTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              시험명 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: Reading Passage 1 - Glass History"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>설명</Label>
            <RichTextEditor
              placeholder="시험에 대한 설명을 입력하세요..."
              value={description}
              onChange={setDescription}
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
              시험 시작 시 학생에게 처음 보여지는 안내 내용입니다. {(sectionType === "speaking" || sectionType === "listening") ? "(필수)" : "(선택)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>안내 페이지 제목 {(sectionType === "speaking" || sectionType === "listening") && <span className="text-red-500">*</span>}</Label>
              <Input
                placeholder="예: Reading Test Instructions"
                value={instructionTitle}
                onChange={(e) => setInstructionTitle(e.target.value)}
              />
            </div>
            {(sectionType === "listening" || sectionType === "speaking") && (
              <div className="space-y-2">
                <Label>안내 페이지 오디오 {(sectionType === "speaking" || sectionType === "listening") && <span className="text-red-500">*</span>}</Label>
                <FileUpload
                  value={instructionAudioUrl}
                  onChange={(url) => setInstructionAudioUrl(url)}
                  accept="audio"
                  placeholder="안내 페이지 오디오 파일 업로드"
                  deferred
                  onFileReady={(file) => setInstructionAudioFile(file)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>안내 페이지 내용 {(sectionType === "speaking" || sectionType === "listening") && <span className="text-red-500">*</span>}</Label>
              <RichTextEditor
                placeholder="시험 시작 전 표시될 안내 내용..."
                value={instructionHtml}
                onChange={setInstructionHtml}
                minHeight="120px"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
