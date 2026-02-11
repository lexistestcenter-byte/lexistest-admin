"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { api } from "@/lib/api/client";

/* ─── Types ─── */

interface SectionItem {
  id: string;
  title: string;
  section_type: string;
  difficulty: string | null;
  is_practice: boolean;
  time_limit_minutes: number | null;
}

/* ─── Constants ─── */

const typeColors: Record<string, string> = {
  listening: "bg-white text-sky-500 border border-sky-300",
  reading: "bg-white text-emerald-500 border border-emerald-300",
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const typeLabels: Record<string, string> = {
  listening: "L",
  reading: "R",
  writing: "W",
  speaking: "S",
};

const examTypeLabels: Record<string, string> = {
  full: "Full Test",
  section: "시험별",
  practice: "연습",
  free: "무료",
};

/* ─── Component ─── */

export default function NewPackagePage() {
  const router = useRouter();

  // Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("full");

  // Sections
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ─── Fetch ─── */

  const fetchSections = useCallback(async () => {
    setSectionsLoading(true);
    setSectionsError(null);
    try {
      const { data, error: apiError } = await api.get<{
        sections: SectionItem[];
      }>("/api/sections?limit=200");
      if (apiError) throw new Error(apiError);
      setSections(data?.sections || []);
    } catch (err) {
      setSectionsError(err instanceof Error ? err.message : "시험 목록 조회 실패");
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  /* ─── Section helpers ─── */

  const filteredSections = sections.filter((s) => {
    const matchesType = filterType === "all" || s.section_type === filterType;
    const matchesSearch =
      searchQuery === "" || s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPractice = examType === "practice" ? s.is_practice : true;
    return matchesType && matchesSearch && matchesPractice;
  });

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const removeSection = (id: string) => {
    setSelectedSections((prev) => prev.filter((sId) => sId !== id));
  };

  const selectedSectionDetails = sections.filter((s) => selectedSections.includes(s.id));
  const totalTime = selectedSectionDetails.reduce((sum, s) => sum + (s.time_limit_minutes || 0), 0);
  const sectionSummary = selectedSectionDetails.reduce((acc, s) => {
    acc[s.section_type] = (acc[s.section_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  /* ─── Save ─── */

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("패키지명은 필수입니다.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const { error: apiError } = await api.post("/api/packages", {
        title: title.trim(),
        description: description.trim() || null,
        exam_type: examType,
        section_ids: selectedSections,
      });
      if (apiError) throw new Error(apiError);
      router.push("/packages");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─── */

  return (
    <div className="space-y-6">
      <PageHeader
        title="패키지 생성"
        description="시험들을 조합하여 새로운 시험 패키지를 생성합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/packages">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        }
      />

      {saveError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>패키지의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>패키지명 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="예: IELTS Academic Full Test 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  placeholder="패키지에 대한 설명을 입력하세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>패키지 유형</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Test</SelectItem>
                    <SelectItem value="section">시험별</SelectItem>
                    <SelectItem value="practice">연습</SelectItem>
                    <SelectItem value="free">무료</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {examType === "full" && "4영역(L/R/W/S) 풀 섹션 시험 패키지입니다."}
                  {examType === "section" && "특정 영역만 선택하여 구성하는 패키지입니다."}
                  {examType === "practice" && "연습 전용 시험들로만 구성할 수 있습니다."}
                  {examType === "free" && "무료로 제공되는 패키지입니다."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>이미지</CardTitle>
              <CardDescription>패키지 썸네일 이미지를 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">이미지를 업로드하세요</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (권장: 800x600)</p>
              </div>
            </CardContent>
          </Card>

          {/* 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>패키지 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">유형</span>
                  <Badge variant="outline">{examTypeLabels[examType]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">선택된 시험</span>
                  <span className="font-medium">{selectedSections.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예상 소요 시간</span>
                  <span className="font-medium">{totalTime}분</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">구성</span>
                  <div className="flex gap-1">
                    {Object.entries(sectionSummary).map(([type, count]) => (
                      <Badge key={type} variant="outline" className={typeColors[type]}>
                        {typeLabels[type]}&times;{count}
                      </Badge>
                    ))}
                    {Object.keys(sectionSummary).length === 0 && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Section Selection ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시험 선택</CardTitle>
              <CardDescription>
                {examType === "practice" ? "연습 전용 시험만 표시됩니다." : "패키지에 포함할 시험들을 선택하세요."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="시험 검색..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 유형</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="speaking">Speaking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sectionsError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {sectionsError}
                </div>
              )}

              {sectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">시험 불러오는 중...</span>
                </div>
              ) : (
                <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>시험명</TableHead>
                        <TableHead className="text-right">시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSections.map((section) => (
                        <TableRow key={section.id} className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSections.includes(section.id)}
                              onCheckedChange={() => toggleSection(section.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 text-xs rounded ${typeColors[section.section_type] || ""}`}>
                              {section.section_type.charAt(0).toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{section.title}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {section.time_limit_minutes ? `${section.time_limit_minutes}분` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSections.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {examType === "practice" ? "연습 전용 시험이 없습니다." : "시험이 없습니다."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{filteredSections.length}개 시험</span>
                <span>{selectedSections.length}개 선택됨</span>
              </div>
            </CardContent>
          </Card>

          {/* 선택된 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle>선택된 시험 ({selectedSections.length})</CardTitle>
              <CardDescription>드래그하여 순서를 변경할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSectionDetails.length > 0 ? (
                <div className="space-y-2">
                  {selectedSectionDetails.map((section, index) => (
                    <div key={section.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="text-sm font-medium w-6">{index + 1}.</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${typeColors[section.section_type] || ""}`}>
                        {section.section_type.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 font-medium text-sm">{section.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {section.time_limit_minutes ? `${section.time_limit_minutes}분` : "-"}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSection(section.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">위 목록에서 시험을 선택하세요.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
