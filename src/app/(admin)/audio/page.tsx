"use client";

import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Pencil, Trash2, Play, Download, Headphones } from "lucide-react";

interface AudioRow {
  id: string;
  exam_title: string;
  section_type: "listening" | "speaking";
  audio_type: "section_full" | "question_audio" | "speaking_prompt";
  duration_seconds?: number;
  has_transcript: boolean;
  created_at: string;
}

// Mock data
const mockAudioFiles: AudioRow[] = [
  {
    id: "1",
    exam_title: "IELTS Academic Mock Test 1",
    section_type: "listening",
    audio_type: "section_full",
    duration_seconds: 1800,
    has_transcript: true,
    created_at: "2026-01-15",
  },
  {
    id: "2",
    exam_title: "Listening Practice Set 1",
    section_type: "listening",
    audio_type: "question_audio",
    duration_seconds: 120,
    has_transcript: true,
    created_at: "2026-01-10",
  },
  {
    id: "3",
    exam_title: "Speaking Practice Set 1",
    section_type: "speaking",
    audio_type: "speaking_prompt",
    duration_seconds: 30,
    has_transcript: true,
    created_at: "2025-12-15",
  },
  {
    id: "4",
    exam_title: "IELTS Academic Mock Test 2",
    section_type: "listening",
    audio_type: "section_full",
    duration_seconds: 1850,
    has_transcript: false,
    created_at: "2025-12-10",
  },
];

const audioTypeLabels = {
  section_full: "섹션 전체",
  question_audio: "문제별",
  speaking_prompt: "Speaking 프롬프트",
};

const sectionColors = {
  listening: "bg-white text-sky-500 border border-sky-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const columns: Column<AudioRow>[] = [
  {
    key: "exam",
    header: "시험",
    cell: (audio) => (
      <div className="flex items-center gap-2">
        <Headphones className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{audio.exam_title}</span>
      </div>
    ),
  },
  {
    key: "section",
    header: "섹션",
    cell: (audio) => (
      <span className={`px-2 py-1 text-xs rounded ${sectionColors[audio.section_type]}`}>
        {audio.section_type === "listening" ? "Listening" : "Speaking"}
      </span>
    ),
  },
  {
    key: "type",
    header: "유형",
    cell: (audio) => (
      <Badge variant="outline">{audioTypeLabels[audio.audio_type]}</Badge>
    ),
  },
  {
    key: "duration",
    header: "재생 시간",
    cell: (audio) => formatDuration(audio.duration_seconds),
  },
  {
    key: "transcript",
    header: "스크립트",
    cell: (audio) => (
      <Badge variant={audio.has_transcript ? "default" : "secondary"}>
        {audio.has_transcript ? "있음" : "없음"}
      </Badge>
    ),
  },
  {
    key: "created_at",
    header: "생성일",
    cell: (audio) => (
      <span className="text-muted-foreground">{audio.created_at}</span>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>작업</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Play className="mr-2 h-4 w-4" />
            재생
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            다운로드
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    className: "w-[50px]",
  },
];

export default function AudioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="오디오 관리"
        description="Listening/Speaking 오디오 파일을 관리합니다."
        createHref="/audio/new"
        createLabel="오디오 업로드"
      />

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="섹션" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 섹션</SelectItem>
            <SelectItem value="listening">Listening</SelectItem>
            <SelectItem value="speaking">Speaking</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="section_full">섹션 전체</SelectItem>
            <SelectItem value="question_audio">문제별</SelectItem>
            <SelectItem value="speaking_prompt">Speaking 프롬프트</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={mockAudioFiles}
        searchPlaceholder="시험명으로 검색..."
        totalItems={234}
      />
    </div>
  );
}
