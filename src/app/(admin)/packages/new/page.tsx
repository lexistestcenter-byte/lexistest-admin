"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
  Trash2,
  Upload,
  Save,
  ArrowLeft,
  Search,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { api } from "@/lib/api/client";
import { PackagePreview } from "@/components/packages/package-preview";
import { SortableSectionItem } from "@/components/packages/sortable-section-item";

/* ─── Types ─── */

interface SectionItem {
  id: string;
  title: string;
  section_type: string;
  difficulty: string | null;
  is_practice: boolean;
  time_limit_minutes: number | null;
}

interface PackageItem {
  id: string;
  title: string;
  exam_type: string;
  is_practice: boolean;
  section_count: number;
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
  const [isBundle, setIsBundle] = useState(false);

  // Instruction page
  const [instructionTitle, setInstructionTitle] = useState("");
  const [instructionContent, setInstructionContent] = useState("");

  // Sections
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // Bundle packages
  const [availablePackages, setAvailablePackages] = useState<PackageItem[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packageSearchQuery, setPackageSearchQuery] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

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

  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const { data, error: apiError } = await api.get<{
        packages: PackageItem[];
      }>("/api/packages?limit=200&is_bundle=false");
      if (apiError) throw new Error(apiError);
      setAvailablePackages(
        (data?.packages || []).map((p) => ({
          ...p,
          section_count: p.section_count || 0,
        }))
      );
    } catch {
      // non-critical
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (isBundle) fetchPackages();
  }, [isBundle, fetchPackages]);

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

  const selectedSectionDetails = useMemo(
    () =>
      selectedSections
        .map((id) => sections.find((s) => s.id === id))
        .filter((s): s is SectionItem => s !== undefined),
    [selectedSections, sections]
  );
  const totalTime = selectedSectionDetails.reduce((sum, s) => sum + (s.time_limit_minutes || 0), 0);
  const sectionSummary = selectedSectionDetails.reduce((acc, s) => {
    acc[s.section_type] = (acc[s.section_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  /* ─── Bundle package helpers ─── */

  const filteredPackages = availablePackages.filter((p) =>
    packageSearchQuery === "" || p.title.toLowerCase().includes(packageSearchQuery.toLowerCase())
  );

  const togglePackage = (id: string) => {
    setSelectedPackageIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const removePackage = (id: string) => {
    setSelectedPackageIds((prev) => prev.filter((pId) => pId !== id));
  };

  const selectedPackageDetails = useMemo(
    () =>
      selectedPackageIds
        .map((id) => availablePackages.find((p) => p.id === id))
        .filter((p): p is PackageItem => p !== undefined),
    [selectedPackageIds, availablePackages]
  );

  /* ─── DnD ─── */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (isBundle) {
      setSelectedPackageIds((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    } else {
      setSelectedSections((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [isBundle]);

  /* ─── Save ─── */

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("패키지명은 필수입니다.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        exam_type: examType,
        is_bundle: isBundle,
        instruction_title: instructionTitle.trim() || null,
        instruction_content: instructionContent.trim() || null,
      };
      if (isBundle) {
        payload.child_package_ids = selectedPackageIds;
      } else {
        payload.section_ids = selectedSections;
      }
      const { error: apiError } = await api.post("/api/packages", payload);
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
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={isBundle || selectedSections.length === 0}
            >
              <Eye className="mr-2 h-4 w-4" />
              미리보기
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
                <RichTextEditor
                  placeholder="패키지에 대한 설명을 입력하세요..."
                  value={description}
                  onChange={setDescription}
                  minHeight="80px"
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
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>번들 패키지</Label>
                  <p className="text-xs text-muted-foreground">
                    여러 패키지를 묶어 하나의 번들로 판매합니다.
                  </p>
                </div>
                <Switch
                  checked={isBundle}
                  onCheckedChange={(checked) => {
                    setIsBundle(checked);
                    if (checked) {
                      setSelectedSections([]);
                    } else {
                      setSelectedPackageIds([]);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 안내 페이지 */}
          <Card>
            <CardHeader>
              <CardTitle>안내 페이지</CardTitle>
              <CardDescription>
                패키지 시작 시 학생에게 처음 보여지는 안내 내용입니다. (선택)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>안내 제목</Label>
                <Input
                  placeholder="예: IELTS Test Instructions"
                  value={instructionTitle}
                  onChange={(e) => setInstructionTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>안내 내용</Label>
                <RichTextEditor
                  placeholder="시험 시작 전 표시될 안내 내용..."
                  value={instructionContent}
                  onChange={setInstructionContent}
                  minHeight="120px"
                />
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
                  <div className="flex gap-1">
                    <Badge variant="outline">{examTypeLabels[examType]}</Badge>
                    {isBundle && <Badge variant="outline" className="text-purple-600">번들</Badge>}
                  </div>
                </div>
                {isBundle ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">포함 패키지</span>
                    <span className="font-medium">{selectedPackageIds.length}개</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">
          {isBundle ? (
            <>
              {/* 번들: 패키지 선택 */}
              <Card>
                <CardHeader>
                  <CardTitle>패키지 선택</CardTitle>
                  <CardDescription>번들에 포함할 패키지들을 선택하세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="패키지 검색..."
                      className="pl-9"
                      value={packageSearchQuery}
                      onChange={(e) => setPackageSearchQuery(e.target.value)}
                    />
                  </div>

                  {packagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">패키지 불러오는 중...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>패키지명</TableHead>
                            <TableHead>유형</TableHead>
                            <TableHead className="text-right">시험 수</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPackages.map((pkg) => (
                            <TableRow key={pkg.id} className="cursor-pointer" onClick={() => togglePackage(pkg.id)}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedPackageIds.includes(pkg.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={() => togglePackage(pkg.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{pkg.title}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{examTypeLabels[pkg.exam_type] || pkg.exam_type}</Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {pkg.section_count}개
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredPackages.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                선택 가능한 패키지가 없습니다.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{filteredPackages.length}개 패키지</span>
                    <span>{selectedPackageIds.length}개 선택됨</span>
                  </div>
                </CardContent>
              </Card>

              {/* 번들: 선택된 패키지 순서 */}
              <Card>
                <CardHeader>
                  <CardTitle>선택된 패키지 ({selectedPackageIds.length})</CardTitle>
                  <CardDescription>드래그하여 순서를 변경할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPackageDetails.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedPackageIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {selectedPackageDetails.map((pkg, index) => (
                            <SortableSectionItem
                              key={pkg.id}
                              id={pkg.id}
                              index={index}
                              title={pkg.title}
                              sectionType={pkg.exam_type}
                              timeLimitMinutes={null}
                              typeColors={{}}
                              onRemove={() => removePackage(pkg.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">위 목록에서 패키지를 선택하세요.</div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* 일반: 시험 선택 */}
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
                                  onClick={(e) => e.stopPropagation()}
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

              {/* 일반: 선택된 섹션 */}
              <Card>
                <CardHeader>
                  <CardTitle>선택된 시험 ({selectedSections.length})</CardTitle>
                  <CardDescription>드래그하여 순서를 변경할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSectionDetails.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedSections}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {selectedSectionDetails.map((section, index) => (
                            <SortableSectionItem
                              key={section.id}
                              id={section.id}
                              index={index}
                              title={section.title}
                              sectionType={section.section_type}
                              timeLimitMinutes={section.time_limit_minutes}
                              typeColors={typeColors}
                              onRemove={() => removeSection(section.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">위 목록에서 시험을 선택하세요.</div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Package Preview */}
      <PackagePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        packageTitle={title || "새 패키지"}
        sectionIds={selectedSections}
        allSections={sections}
        instructionTitle={instructionTitle}
        instructionContent={instructionContent}
      />
    </div>
  );
}
