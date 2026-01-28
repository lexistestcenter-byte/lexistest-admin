"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  Upload,
  GripVertical,
  Save,
  ArrowLeft,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Question {
  id: string;
  question_code: string;
  question_type: string;
  question_format: string;
  content: string;
  title: string | null;
  difficulty: string | null;
  is_active: boolean;
}

const typeColors: Record<string, string> = {
  listening: "bg-white text-sky-500 border border-sky-300",
  reading: "bg-white text-emerald-500 border border-emerald-300",
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const formatLabels: Record<string, string> = {
  mcq: "4지선다",
  mcq_multiple: "복수선택",
  fill_blank_typing: "빈칸(입력)",
  fill_blank_drag: "빈칸(드래그)",
  true_false_ng: "T/F/NG",
  heading_matching: "제목매칭",
  flowchart: "플로우차트",
  map_labeling: "지도라벨링",
  essay_task1: "Task 1",
  essay_task2: "Task 2",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

export default function NewSectionPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Form state
  const [sectionType, setSectionType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [isPractice, setIsPractice] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Reading specific
  const [passageTitle, setPassageTitle] = useState<string>("");
  const [passageContent, setPassageContent] = useState<string>("");

  // Listening specific
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioTranscript, setAudioTranscript] = useState<string>("");

  // Instruction page
  const [instructionTitle, setInstructionTitle] = useState<string>("");
  const [instructionHtml, setInstructionHtml] = useState<string>("");

  // Questions
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load available questions when section type changes
  const loadAvailableQuestions = useCallback(async () => {
    if (!sectionType) {
      setAvailableQuestions([]);
      return;
    }

    setIsLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      params.set("question_type", sectionType);
      params.set("is_active", "true");
      params.set("limit", "100");
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const result = await response.json();
      setAvailableQuestions(result.questions || []);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("문제 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [sectionType, searchQuery]);

  useEffect(() => {
    loadAvailableQuestions();
  }, [loadAvailableQuestions]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAvailableQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const removeQuestion = (id: string) => {
    setSelectedQuestions((prev) => prev.filter((qId) => qId !== id));
  };

  const selectedQuestionDetails = availableQuestions.filter((q) =>
    selectedQuestions.includes(q.id)
  );

  // Save section
  const handleSave = async () => {
    if (!sectionType || !title) {
      toast.error("섹션 유형과 제목은 필수입니다.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create section
      const sectionData = {
        section_type: sectionType,
        title,
        description: description || null,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        difficulty: difficulty || null,
        is_practice: isPractice,
        is_active: isActive,
        passage_title: sectionType === "reading" ? passageTitle || null : null,
        passage_content: sectionType === "reading" ? passageContent || null : null,
        audio_url: sectionType === "listening" ? audioUrl || null : null,
        audio_transcript: sectionType === "listening" ? audioTranscript || null : null,
        instruction_title: instructionTitle || null,
        instruction_html: instructionHtml || null,
      };

      const sectionResponse = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionData),
      });

      if (!sectionResponse.ok) {
        const error = await sectionResponse.json();
        throw new Error(error.error || "Failed to create section");
      }

      const newSection = await sectionResponse.json();

      // 2. Add questions to section
      if (selectedQuestions.length > 0) {
        for (let i = 0; i < selectedQuestions.length; i++) {
          const questionId = selectedQuestions[i];
          await fetch(`/api/sections/${newSection.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              item_type: "question",
              question_id: questionId,
              question_number_start: i + 1,
              display_order: i,
            }),
          });
        }
      }

      toast.success("섹션이 생성되었습니다.");
      router.push("/sections");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error(
        error instanceof Error ? error.message : "섹션 생성에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="섹션 생성"
        description="문제들을 조합하여 새로운 섹션을 생성합니다. 섹션은 여러 패키지에서 재사용할 수 있습니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/sections">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Section Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>섹션의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>섹션 유형 *</Label>
                <Select
                  value={sectionType}
                  onValueChange={(v) => {
                    setSectionType(v);
                    setSelectedQuestions([]);
                  }}
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
                <Label>섹션명 *</Label>
                <Input
                  placeholder="예: Reading Passage 1 - Glass History"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  placeholder="섹션에 대한 설명을 입력하세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>제한 시간 (분)</Label>
                  <Input
                    type="number"
                    placeholder="예: 20"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>난이도</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">쉬움</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="hard">어려움</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>연습 섹션</Label>
                  <p className="text-xs text-muted-foreground">연습용 섹션으로 표시됩니다.</p>
                </div>
                <Switch checked={isPractice} onCheckedChange={setIsPractice} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>활성 상태</Label>
                  <p className="text-xs text-muted-foreground">비활성화하면 노출되지 않습니다.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이미지 및 안내</CardTitle>
              <CardDescription>섹션 썸네일과 안내 페이지를 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>썸네일 이미지</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    이미지를 업로드하세요
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG (권장: 400x300)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>안내 페이지 제목</Label>
                <Input
                  placeholder="예: Reading Test Instructions"
                  value={instructionTitle}
                  onChange={(e) => setInstructionTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>안내 페이지 내용</Label>
                <Textarea
                  placeholder="시험 시작 전 표시될 안내 내용..."
                  rows={4}
                  value={instructionHtml}
                  onChange={(e) => setInstructionHtml(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reading: Passage */}
          {sectionType === "reading" && (
            <Card>
              <CardHeader>
                <CardTitle>지문 (Passage)</CardTitle>
                <CardDescription>Reading 섹션의 지문을 입력합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>지문 제목</Label>
                  <Input
                    placeholder="예: The History of Glass"
                    value={passageTitle}
                    onChange={(e) => setPassageTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>지문 내용</Label>
                  <Textarea
                    placeholder="지문 내용을 입력하세요..."
                    rows={10}
                    value={passageContent}
                    onChange={(e) => setPassageContent(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listening: Audio */}
          {sectionType === "listening" && (
            <Card>
              <CardHeader>
                <CardTitle>오디오 파일</CardTitle>
                <CardDescription>Listening 섹션의 전체 오디오를 업로드합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>오디오 URL</Label>
                  <Input
                    placeholder="https://example.com/audio.mp3"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>스크립트</Label>
                  <Textarea
                    placeholder="오디오 스크립트를 입력하세요..."
                    rows={6}
                    value={audioTranscript}
                    onChange={(e) => setAudioTranscript(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Question Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>문제 선택</CardTitle>
              <CardDescription>
                {sectionType
                  ? `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} 유형의 문제를 선택하세요.`
                  : "먼저 섹션 유형을 선택하세요."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionType && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="문제 검색..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    {isLoadingQuestions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>코드</TableHead>
                            <TableHead>형태</TableHead>
                            <TableHead>내용</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableQuestions.length > 0 ? (
                            availableQuestions.map((q) => (
                              <TableRow
                                key={q.id}
                                className="cursor-pointer"
                                onClick={() => toggleQuestion(q.id)}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedQuestions.includes(q.id)}
                                    onCheckedChange={() => toggleQuestion(q.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {q.question_code}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {formatLabels[q.question_format] || q.question_format}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                                  {q.title || q.content}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-muted-foreground py-8"
                              >
                                해당 유형의 문제가 없습니다.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{availableQuestions.length}개 문제</span>
                    <span>{selectedQuestions.length}개 선택됨</span>
                  </div>
                </>
              )}

              {!sectionType && (
                <div className="text-center py-8 text-muted-foreground">
                  섹션 유형을 먼저 선택하세요.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Questions */}
          <Card>
            <CardHeader>
              <CardTitle>선택된 문제 ({selectedQuestions.length})</CardTitle>
              <CardDescription>드래그하여 순서를 변경할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedQuestionDetails.length > 0 ? (
                <div className="space-y-2">
                  {selectedQuestionDetails.map((q, index) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="text-sm font-medium w-6">{index + 1}.</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          typeColors[q.question_type] || "bg-gray-100"
                        }`}
                      >
                        {q.question_code}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatLabels[q.question_format] || q.question_format}
                      </Badge>
                      <span className="flex-1 text-sm text-muted-foreground line-clamp-1">
                        {q.title || q.content}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  위 목록에서 문제를 선택하세요.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
