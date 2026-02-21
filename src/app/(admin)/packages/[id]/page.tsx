"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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

interface PackageSectionItem {
  id: string;
  section_id: string;
  display_order: number;
  custom_time_limit_minutes: number | null;
  sections: SectionItem;
}

interface PackageBundleItem {
  id: string;
  child_package_id: string;
  display_order: number;
  child_package: {
    id: string;
    title: string;
    exam_type: string;
    is_practice: boolean;
    is_bundle: boolean;
  };
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
  is_bundle: boolean;
  access_type: string;
  is_published: boolean;
  is_free: boolean;
  display_order: number | null;
  tags: string[] | null;
  instruction_title: string | null;
  instruction_content: string | null;
  package_sections: PackageSectionItem[];
  package_bundles: PackageBundleItem[];
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

const examTypeLabels: Record<string, string> = {
  full: "Full Test",
  section: "시험별",
  practice: "연습",
  free: "무료",
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

  // Bundle
  const [isBundle, setIsBundle] = useState(false);

  // Instruction page
  const [instructionTitle, setInstructionTitle] = useState("");
  const [instructionContent, setInstructionContent] = useState("");

  // Sections
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [allSections, setAllSections] = useState<SectionItem[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Bundle packages
  const [availablePackages, setAvailablePackages] = useState<PackageItem[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packageSearchQuery, setPackageSearchQuery] = useState("");

  // Save/Delete states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

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
      setIsBundle(pkg.is_bundle || false);
      setAccessType(pkg.access_type || "public");
      setInstructionTitle(pkg.instruction_title || "");
      setInstructionContent(pkg.instruction_content || "");

      // Sort package_sections by display_order and extract section IDs
      const sorted = (pkg.package_sections || [])
        .sort((a, b) => a.display_order - b.display_order);
      setSelectedSectionIds(sorted.map((ps) => ps.section_id));

      // Load bundle children
      if (pkg.is_bundle && pkg.package_bundles?.length > 0) {
        const sortedBundles = [...pkg.package_bundles].sort((a, b) => a.display_order - b.display_order);
        setSelectedPackageIds(sortedBundles.map((b) => b.child_package_id));
      }
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

  // Load available packages for bundle mode
  const loadBundlePackages = useCallback(async () => {
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
    loadPackage();
    loadSections();
  }, [loadPackage, loadSections]);

  useEffect(() => {
    if (isBundle) loadBundlePackages();
  }, [isBundle, loadBundlePackages]);

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

  // Get selected section details in order
  const selectedSectionDetails = useMemo(
    () =>
      selectedSectionIds
        .map((sId) => allSections.find((s) => s.id === sId))
        .filter((s): s is SectionItem => s !== undefined),
    [selectedSectionIds, allSections]
  );

  // Bundle package helpers
  const filteredBundlePackages = availablePackages.filter((p) =>
    packageSearchQuery === "" || p.title.toLowerCase().includes(packageSearchQuery.toLowerCase())
  );

  const togglePackage = (pkgId: string) => {
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId)
        ? prev.filter((pId) => pId !== pkgId)
        : [...prev, pkgId]
    );
  };

  const removePackage = (pkgId: string) => {
    setSelectedPackageIds((prev) => prev.filter((pId) => pId !== pkgId));
  };

  const selectedPackageDetails = useMemo(
    () =>
      selectedPackageIds
        .map((pId) => availablePackages.find((p) => p.id === pId))
        .filter((p): p is PackageItem => p !== undefined),
    [selectedPackageIds, availablePackages]
  );

  // DnD
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
      setSelectedSectionIds((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [isBundle]);

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
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        exam_type: examType,
        difficulty: difficulty || null,
        time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        display_order: displayOrder ? Number(displayOrder) : null,
        is_practice: isPractice,
        is_bundle: isBundle,
        is_published: isPublished,
        is_free: isFree,
        access_type: accessType,
        instruction_title: instructionTitle.trim() || null,
        instruction_content: instructionContent.trim() || null,
      };
      if (isBundle) {
        payload.child_package_ids = selectedPackageIds;
      } else {
        payload.section_ids = selectedSectionIds;
      }
      const { error: apiError } = await api.put(`/api/packages/${id}`, payload);
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
        description="시험 구성을 변경하여 시험 패키지를 수정합니다."
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
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={isBundle || selectedSectionIds.length === 0}
            >
              <Eye className="mr-2 h-4 w-4" />
              미리보기
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>패키지 유형</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Test</SelectItem>
                      <SelectItem value="section_only">시험별</SelectItem>
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
                  <Label>시험시간(분)</Label>
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
                    <Label>번들 패키지</Label>
                    <p className="text-xs text-muted-foreground">여러 패키지를 묶어 하나의 번들로 판매합니다.</p>
                  </div>
                  <Switch
                    checked={isBundle}
                    onCheckedChange={(checked) => {
                      setIsBundle(checked);
                      if (checked) {
                        setSelectedSectionIds([]);
                      } else {
                        setSelectedPackageIds([]);
                      }
                    }}
                  />
                </div>
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

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>패키지 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isBundle ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">포함 패키지</span>
                    <span className="font-medium">{selectedPackageIds.length}개</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">선택된 시험</span>
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
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">상태</span>
                  <div className="flex gap-1">
                    {isBundle && <Badge variant="outline" className="text-purple-600">번들</Badge>}
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

        {/* Right Column */}
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
                          {filteredBundlePackages.map((pkg) => (
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
                          {filteredBundlePackages.length === 0 && (
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
                    <span>{filteredBundlePackages.length}개 패키지</span>
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
                    <div className="text-center py-8 text-muted-foreground">
                      위 목록에서 패키지를 선택하세요.
                    </div>
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
                  <CardDescription>패키지에 포함할 시험들을 선택하세요.</CardDescription>
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
                            <TableRow
                              key={section.id}
                              className="cursor-pointer"
                              onClick={() => toggleSection(section.id)}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedSectionIds.includes(section.id)}
                                  onClick={(e) => e.stopPropagation()}
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
                                시험이 없습니다.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{filteredSections.length}개 시험</span>
                    <span>{selectedSectionIds.length}개 선택됨</span>
                  </div>
                </CardContent>
              </Card>

              {/* 일반: 선택된 시험 순서 */}
              <Card>
                <CardHeader>
                  <CardTitle>시험 구성 순서 ({selectedSectionIds.length})</CardTitle>
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
                        items={selectedSectionIds}
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
                    <div className="text-center py-8 text-muted-foreground">
                      위 목록에서 시험을 선택하세요.
                    </div>
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
        packageTitle={title || "패키지"}
        sectionIds={selectedSectionIds}
        allSections={allSections}
        instructionTitle={instructionTitle}
        instructionContent={instructionContent}
      />
    </div>
  );
}
