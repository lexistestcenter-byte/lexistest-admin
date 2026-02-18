"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DateRangePicker,
  DateRange,
} from "@/components/ui/date-range-picker";
import {
  MoreHorizontal,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Eye,
  Users,
  User,
  Search,
  Package,
  CalendarDays,
  MessageSquare,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PackageAssignment } from "@/types";

interface PackageOption {
  id: string;
  title: string;
}

interface GroupOption {
  id: string;
  name: string;
  member_count: number;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
}

interface AssignmentsResponse {
  assignments: PackageAssignment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function AssignmentsPage() {
  const router = useRouter();

  // List state
  const [assignments, setAssignments] = useState<PackageAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Filters
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"group" | "individual">("group");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<StudentOption[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [memo, setMemo] = useState("");

  // Dropdown options
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<PackageAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load assignments
  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());
      if (filterPackage !== "all") params.set("package_id", filterPackage);
      if (filterStatus !== "all") params.set("is_active", filterStatus);

      const { data, error } = await api.get<AssignmentsResponse>(
        `/api/assignments?${params.toString()}`
      );
      if (error) throw new Error(error);

      setAssignments(data?.assignments || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error("할당 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filterPackage, filterStatus]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPackage, filterStatus, search]);

  // Load packages and groups for dropdowns
  const loadDropdownOptions = useCallback(async () => {
    try {
      const [pkgRes, grpRes] = await Promise.all([
        api.get<{ packages: PackageOption[] }>("/api/packages?limit=200"),
        api.get<{ groups: GroupOption[] }>("/api/groups?limit=200"),
      ]);
      if (pkgRes.data?.packages) {
        setPackages(
          pkgRes.data.packages.map((p) => ({
            id: p.id,
            title: p.title,
          }))
        );
      }
      if (grpRes.data?.groups) setGroups(grpRes.data.groups);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadDropdownOptions();
  }, [loadDropdownOptions]);

  // Search students for individual assignment
  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }
    setIsStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("limit", "20");
      const { data, error } = await api.get<{ students: StudentOption[] }>(
        `/api/students?${params.toString()}`
      );
      if (error) throw new Error(error);
      setStudents(data?.students || []);
    } catch (err) {
      console.error("Student search error:", err);
      setStudents([]);
    } finally {
      setIsStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchStudents(studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, searchStudents]);

  // Reset create form
  const resetForm = () => {
    setAssignmentType("group");
    setSelectedPackageId("");
    setSelectedGroupId("");
    setSelectedUsers([]);
    setDateRange({ from: null, to: null });
    setMemo("");
    setStudentSearch("");
    setStudents([]);
  };

  // Create assignment
  const handleCreate = async () => {
    if (!selectedPackageId) {
      toast.error("패키지를 선택해주세요.");
      return;
    }
    if (assignmentType === "group" && !selectedGroupId) {
      toast.error("그룹을 선택해주세요.");
      return;
    }
    if (assignmentType === "individual" && selectedUsers.length === 0) {
      toast.error("학생을 선택해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const basePayload: Record<string, unknown> = {
        package_id: selectedPackageId,
        assignment_type: assignmentType,
      };
      if (dateRange.from) basePayload.scheduled_start = format(dateRange.from, "yyyy-MM-dd'T'HH:mm");
      if (dateRange.to) basePayload.scheduled_end = format(dateRange.to, "yyyy-MM-dd'T'HH:mm");
      if (memo.trim()) basePayload.memo = memo.trim();

      if (assignmentType === "group") {
        basePayload.group_id = selectedGroupId;
        const { error } = await api.post("/api/assignments", basePayload);
        if (error) throw new Error(error);
      } else {
        // 개별 학생: 각각 할당 생성
        const errors: string[] = [];
        for (const user of selectedUsers) {
          const { error } = await api.post("/api/assignments", {
            ...basePayload,
            user_id: user.id,
          });
          if (error) errors.push(`${user.name}: ${error}`);
        }
        if (errors.length > 0) {
          const successCount = selectedUsers.length - errors.length;
          if (successCount > 0) {
            toast.success(`${successCount}명 할당 성공`);
          }
          throw new Error(`${errors.length}건 실패: ${errors[0]}`);
        }
      }

      toast.success(
        assignmentType === "individual" && selectedUsers.length > 1
          ? `${selectedUsers.length}명에게 할당되었습니다.`
          : "할당이 생성되었습니다."
      );
      setIsCreateOpen(false);
      resetForm();
      loadAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "할당 생성에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete (deactivate) assignment
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await api.delete(`/api/assignments/${deleteTarget.id}`);
      if (error) throw new Error(error);

      toast.success("할당이 비활성화되었습니다.");
      loadAssignments();
    } catch (error) {
      console.error("Error deactivating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "할당 비활성화에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Format date range
  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return "-";
    const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR");
    if (start && end) return `${fmt(start)} ~ ${fmt(end)}`;
    if (start) return `${fmt(start)} ~`;
    return `~ ${fmt(end!)}`;
  };

  // Get target display
  const getTargetDisplay = (assignment: PackageAssignment) => {
    if (assignment.assignment_type === "group") {
      return {
        icon: <Users className="h-4 w-4 text-blue-500" />,
        label: assignment.group_name || "-",
        badge: "그룹",
        badgeClass: "bg-blue-100 text-blue-700",
      };
    }
    return {
      icon: <User className="h-4 w-4 text-violet-500" />,
      label: assignment.user_name || "-",
      badge: "개인",
      badgeClass: "bg-violet-100 text-violet-700",
    };
  };

  const columns: Column<PackageAssignment>[] = [
    {
      key: "package",
      header: "패키지",
      cell: (a) => (
        <div className="font-medium max-w-[200px] truncate">
          {a.package_title}
        </div>
      ),
    },
    {
      key: "target",
      header: "대상",
      cell: (a) => {
        const target = getTargetDisplay(a);
        return (
          <div className="flex items-center gap-2">
            {target.icon}
            <span>{target.label}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${target.badgeClass}`}
            >
              {target.badge}
            </span>
          </div>
        );
      },
    },
    {
      key: "schedule",
      header: "시험 기간",
      cell: (a) => (
        <span className="text-sm text-muted-foreground">
          {formatDateRange(a.scheduled_start, a.scheduled_end)}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      cell: (a) => (
        <Badge variant={a.is_active ? "default" : "secondary"}>
          {a.is_active ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "생성일",
      cell: (a) => (
        <span className="text-muted-foreground text-sm">
          {new Date(a.created_at).toLocaleDateString("ko-KR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/assignments/${a.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              상세 보기
            </DropdownMenuItem>
            {a.is_active && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteTarget(a)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  비활성화
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="패키지 할당"
        description="패키지를 그룹 또는 개별 학생에게 할당합니다."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadAssignments()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              할당 생성
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterPackage} onValueChange={setFilterPackage}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="패키지 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 패키지</SelectItem>
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="true">활성</SelectItem>
            <SelectItem value="false">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          searchPlaceholder="패키지명 또는 대상으로 검색..."
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          onSearch={setSearch}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Assignment Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">할당 생성</DialogTitle>
            <DialogDescription>
              패키지를 그룹 또는 학생에게 할당합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Section 1: Package Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Package className="h-3.5 w-3.5 text-primary" />
                </div>
                <Label className="text-sm font-semibold">패키지 선택</Label>
              </div>
              <Select
                value={selectedPackageId}
                onValueChange={setSelectedPackageId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="패키지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t" />

            {/* Section 2: Target Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-primary" />
                </div>
                <Label className="text-sm font-semibold">대상 선택</Label>
              </div>

              {/* Assignment Type */}
              <Select
                value={assignmentType}
                onValueChange={(v) => {
                  setAssignmentType(v as "group" | "individual");
                  setSelectedGroupId("");
                  setSelectedUsers([]);
                  setStudentSearch("");
                  setStudents([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      그룹
                    </div>
                  </SelectItem>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      개별 학생
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Target Selection - Group */}
              {assignmentType === "group" && (
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="그룹을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.member_count}명)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Target Selection - Individual (multi-select) */}
              {assignmentType === "individual" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="이름 또는 이메일로 검색..."
                      className="pl-9"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                  {/* 선택된 학생 칩 목록 */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUsers.map((user) => (
                        <span
                          key={user.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium"
                        >
                          {user.name}
                          <button
                            className="hover:text-violet-900 ml-0.5"
                            onClick={() =>
                              setSelectedUsers((prev) =>
                                prev.filter((u) => u.id !== user.id)
                              )
                            }
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 검색 결과 드롭다운 */}
                  {studentSearch.trim() && (
                    <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                      {isStudentsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">
                            검색중...
                          </span>
                        </div>
                      ) : students.length > 0 ? (
                        <div className="divide-y">
                          {students
                            .filter((s) => !selectedUsers.some((u) => u.id === s.id))
                            .map((s) => (
                              <button
                                key={s.id}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm"
                                onClick={() => {
                                  setSelectedUsers((prev) => [...prev, { id: s.id, name: s.name, email: s.email }]);
                                  setStudentSearch("");
                                  setStudents([]);
                                }}
                              >
                                <span className="font-medium">{s.name}</span>
                                <span className="text-muted-foreground">
                                  {s.email}
                                </span>
                              </button>
                            ))}
                          {students.filter((s) => !selectedUsers.some((u) => u.id === s.id)).length === 0 && (
                            <div className="text-center text-muted-foreground py-4 text-sm">
                              모든 검색 결과가 이미 선택됨
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4 text-sm">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Section 3: Date Range */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                </div>
                <Label className="text-sm font-semibold">기간 설정</Label>
              </div>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            <div className="border-t" />

            {/* Section 4: Memo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <Label className="text-sm font-semibold">메모</Label>
              </div>
              <Textarea
                placeholder="할당에 대한 메모를 입력하세요..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>할당 비활성화</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 할당을 비활성화하시겠습니까?
              <br />
              <strong className="text-foreground">
                {deleteTarget?.package_title}
              </strong>{" "}
              →{" "}
              {deleteTarget?.assignment_type === "group"
                ? deleteTarget?.group_name
                : deleteTarget?.user_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "비활성화"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
