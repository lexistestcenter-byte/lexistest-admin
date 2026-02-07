"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Save,
  ArrowLeft,
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

interface SectionItem {
  id: string;
  title: string;
  section_type: string;
  difficulty: string | null;
  is_practice: boolean;
  time_limit_minutes: number | null;
}

interface PackageSectionItem {
  id: string;
  section_id: string;
  display_order: number;
  custom_time_limit_minutes: number | null;
  sections: SectionItem;
}

interface PackageData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  exam_type: string;
  difficulty: string | null;
  time_limit_minutes: number | null;
  is_practice: boolean;
  access_type: string;
  is_published: boolean;
  is_free: boolean;
  display_order: number | null;
  tags: string[] | null;
  package_sections: PackageSectionItem[];
}

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

export default function EditPackagePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Package fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("full");
  const [difficulty, setDifficulty] = useState<string>("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [accessType, setAccessType] = useState("public");

  // Sections
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [allSections, setAllSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Save/Delete states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load package data
  const loadPackage = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: pkg, error: apiError } = await api.get<PackageData>(`/api/packages/${id}`);
      if (apiError || !pkg) throw new Error(apiError || "패키지를 불러오는데 실패했습니다.");

      setTitle(pkg.title || "");
      setDescription(pkg.description || "");
      setExamType(pkg.exam_type || "full");
      setDifficulty(pkg.difficulty || "");
      setTimeLimitMinutes(pkg.time_limit_minutes ? String(pkg.time_limit_minutes) : "");
      setDisplayOrder(pkg.display_order ? String(pkg.display_order) : "");
      setIsPublished(pkg.is_published);
      setIsFree(pkg.is_free);
      setIsPractice(pkg.is_practice);
      setAccessType(pkg.access_type || "public");

      // Sort package_sections by display_order and extract section IDs
      const sorted = (pkg.package_sections || [])
        .sort((a, b) => a.display_order - b.display_order);
      setSelectedSectionIds(sorted.map((ps) => ps.section_id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "패키지 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load all available sections
  const loadSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      const { data, error: apiError } = await api.get<{ sections: SectionItem[] }>("/api/sections?limit=200");
      if (apiError) throw new Error(apiError);
      setAllSections(data?.sections || []);
    } catch {
      // Sections loading error is non-critical
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackage();
    loadSections();
  }, [loadPackage, loadSections]);

  // Filter sections
  const filteredSections = allSections.filter(
    (s) =>
      (filterType === "all" || s.section_type === filterType) &&
      (searchQuery === "" || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const removeSection = (sectionId: string) => {
    setSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
  };

  // Move section up/down
  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    setSelectedSectionIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveSectionDown = (index: number) => {
    setSelectedSectionIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  // Get selected section details in order
  const selectedSectionDetails = selectedSectionIds
    .map((sId) => allSections.find((s) => s.id === sId))
    .filter((s): s is SectionItem => s !== undefined);

  // Calculate totals
  const totalTime = selectedSectionDetails.reduce(
    (sum, s) => sum + (s.time_limit_minutes || 0),
    0
  );

  const sectionSummary = selectedSectionDetails.reduce(
    (acc, s) => {
      acc[s.section_type] = (acc[s.section_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("패키지명은 필수입니다.");
      return;
    }

    setSaving(true);
    try {
      const { error: apiError } = await api.put(`/api/packages/${id}`, {
        title: title.trim(),
        description: description.trim() || null,
        exam_type: examType,
        difficulty: difficulty || null,
        time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        display_order: displayOrder ? Number(displayOrder) : null,
        is_practice: isPractice,
        is_published: isPublished,
        is_free: isFree,
        access_type: accessType,
        section_ids: selectedSectionIds,
      });
      if (apiError) throw new Error(apiError);

      toast.success("패키지가 저장되었습니다.");
      router.push("/packages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error: apiError } = await api.delete(`/api/packages/${id}`);
      if (apiError) throw new Error(apiError);
      toast.success("패키지가 삭제되었습니다.");
      router.push("/packages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">패키지 불러오는 중...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">{loadError}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/packages">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="패키지 수정"
        description="섹션 구성을 변경하여 시험 패키지를 수정합니다."
        actions={
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>패키지를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{title}&quot; 패키지가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" asChild>
              <Link href="/packages">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Package Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>패키지의 기본 정보를 수정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>패키지명 *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>패키지 유형</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Test</SelectItem>
                      <SelectItem value="section_only">섹션별</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시간 제한 (분)</Label>
                  <Input
                    type="number"
                    placeholder="예: 180"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>표시 순서</Label>
                  <Input
                    type="number"
                    placeholder="예: 1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>연습 패키지</Label>
                    <p className="text-xs text-muted-foreground">연습용 패키지로 표시됩니다.</p>
                  </div>
                  <Switch checked={isPractice} onCheckedChange={setIsPractice} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>공개 여부</Label>
                    <p className="text-xs text-muted-foreground">공개 시 사용자에게 노출됩니다.</p>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>무료 제공</Label>
                    <p className="text-xs text-muted-foreground">무료로 이용 가능하게 설정합니다.</p>
                  </div>
                  <Switch checked={isFree} onCheckedChange={setIsFree} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>패키지 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">선택된 섹션</span>
                  <span className="font-medium">{selectedSectionIds.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예상 소요 시간</span>
                  <span className="font-medium">{totalTime}분</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">구성</span>
                  <div className="flex gap-1">
                    {Object.entries(sectionSummary).map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={typeColors[type] || ""}
                      >
                        {typeLabels[type] || type.charAt(0).toUpperCase()}&times;{count}
                      </Badge>
                    ))}
                    {Object.keys(sectionSummary).length === 0 && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">상태</span>
                  <div className="flex gap-1">
                    {isPublished ? (
                      <Badge className="bg-green-100 text-green-700">공개</Badge>
                    ) : (
                      <Badge variant="secondary">비공개</Badge>
                    )}
                    {isPractice && <Badge variant="secondary">연습</Badge>}
                    {isFree && <Badge variant="outline" className="text-green-600">무료</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Section Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>섹션 선택</CardTitle>
              <CardDescription>패키지에 포함할 섹션들을 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="섹션 검색..."
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

              {sectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">섹션 불러오는 중...</span>
                </div>
              ) : (
                <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>섹션명</TableHead>
                        <TableHead className="text-right">시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSections.map((section) => (
                        <TableRow
                          key={section.id}
                          className="cursor-pointer"
                          onClick={() => toggleSection(section.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedSectionIds.includes(section.id)}
                              onCheckedChange={() => toggleSection(section.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-0.5 text-xs rounded ${typeColors[section.section_type] || ""}`}>
                                {section.section_type.charAt(0).toUpperCase()}
                              </span>
                              {section.is_practice && (
                                <Badge variant="secondary" className="text-xs">연습</Badge>
                              )}
                            </div>
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
                            섹션이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{filteredSections.length}개 섹션</span>
                <span>{selectedSectionIds.length}개 선택됨</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected Sections with ordering */}
          <Card>
            <CardHeader>
              <CardTitle>시험 구성 순서 ({selectedSectionIds.length})</CardTitle>
              <CardDescription>화살표 버튼으로 섹션 순서를 변경하세요. 위에서부터 시험 순서입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSectionDetails.length > 0 ? (
                <div className="space-y-2">
                  {selectedSectionDetails.map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={index === 0}
                          onClick={() => moveSectionUp(index)}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={index === selectedSectionDetails.length - 1}
                          onClick={() => moveSectionDown(index)}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-medium w-6 text-muted-foreground">{index + 1}.</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${typeColors[section.section_type] || ""}`}>
                        {section.section_type.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 font-medium text-sm truncate">{section.title}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {section.time_limit_minutes ? `${section.time_limit_minutes}분` : "-"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  위 목록에서 섹션을 선택하세요.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
