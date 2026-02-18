"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DateRangePicker,
  DateRange,
} from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Package, Users, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

interface StudentGroup {
  id: string;
  name: string;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  groups: StudentGroup[];
  package_access_count: number;
  last_login_at?: string;
  created_at: string;
}

interface StudentsResponse {
  students: StudentRow[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface GroupOption {
  id: string;
  name: string;
}

interface GroupsResponse {
  groups: GroupOption[];
}

interface PackageOption {
  id: string;
  title: string;
}

interface PackagesResponse {
  packages: PackageOption[];
}

export default function StudentsPage() {
  const router = useRouter();

  // List state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Access modal
  const [selectedPackage, setSelectedPackage] = useState("");
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  // Group modal
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState<GroupOption[]>([]);

  // Load students
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());
      if (search) params.set("search", search);

      const { data, error } = await api.get<StudentsResponse>(`/api/students?${params.toString()}`);

      if (error) {
        // Fallback: /api/students가 없으면 /api/users 사용
        const { data: usersData, error: usersError } = await api.get<{ users: Array<{ id: string; name: string; email: string; created_at: string }>; pagination: { total: number } }>(`/api/users?${params.toString()}`);
        if (usersError) throw new Error(usersError);
        // /api/users는 groups, package_access_count 등이 없으므로 기본값 설정
        const mapped: StudentRow[] = (usersData?.users || []).map((u) => ({
          ...u,
          groups: [],
          package_access_count: 0,
        }));
        setStudents(mapped);
        setTotalItems(usersData?.pagination?.total || 0);
        return;
      }

      setStudents(data?.students || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("학생 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load packages for assignment modal
  const loadPackages = async () => {
    try {
      const { data, error } = await api.get<PackagesResponse>("/api/packages?limit=100");
      if (error) throw new Error(error);
      setPackages(data?.packages || []);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  // Load groups for assignment modal
  const loadGroups = async () => {
    try {
      const { data, error } = await api.get<GroupsResponse>("/api/groups?limit=100");
      if (error) throw new Error(error);
      setGroups(data?.groups || []);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const openDetailModal = (student: StudentRow) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const openAccessModal = (student: StudentRow) => {
    setSelectedStudent(student);
    setSelectedPackage("");
    setDateRange({ from: null, to: null });
    setIsAccessOpen(true);
    loadPackages();
  };

  const openGroupModal = (student: StudentRow) => {
    setSelectedStudent(student);
    setSelectedGroup("");
    setIsGroupOpen(true);
    loadGroups();
  };

  const handleAddAccess = async () => {
    if (!selectedStudent || !selectedPackage) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        package_ids: [selectedPackage],
      };
      if (dateRange.from) payload.available_from = format(dateRange.from, "yyyy-MM-dd'T'HH:mm");
      if (dateRange.to) payload.available_until = format(dateRange.to, "yyyy-MM-dd'T'HH:mm");

      const { error } = await api.post(`/api/students/${selectedStudent.id}/packages`, payload);
      if (error) throw new Error(error);

      toast.success("패키지가 배정되었습니다.");
      setIsAccessOpen(false);
      loadStudents();
    } catch (error) {
      console.error("Error assigning package:", error);
      toast.error("패키지 배정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedStudent || !selectedGroup) return;
    setIsSaving(true);
    try {
      const { error } = await api.post(`/api/groups/${selectedGroup}/members`, {
        user_ids: [selectedStudent.id],
      });
      if (error) throw new Error(error);

      toast.success("그룹에 배정되었습니다.");
      setIsGroupOpen(false);
      loadStudents();
    } catch (error) {
      console.error("Error assigning to group:", error);
      toast.error("그룹 배정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: "학생",
      cell: (student) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:text-primary"
          onClick={() => openDetailModal(student)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{student.name}</div>
            <div className="text-sm text-muted-foreground">{student.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "groups",
      header: "소속 그룹",
      cell: (student) => (
        <div className="flex flex-wrap gap-1">
          {student.groups.length > 0 ? (
            student.groups.map((group) => (
              <Badge key={group.id} variant="secondary" className="text-xs">
                {group.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">없음</span>
          )}
        </div>
      ),
    },
    {
      key: "package_access_count",
      header: "패키지",
      cell: (student) => (
        <span className="text-muted-foreground">{student.package_access_count}개</span>
      ),
    },
    {
      key: "last_login_at",
      header: "마지막 접속",
      cell: (student) => (
        <span className="text-muted-foreground text-sm">
          {student.last_login_at
            ? new Date(student.last_login_at).toLocaleString("ko-KR")
            : "접속 기록 없음"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDetailModal(student)}>
              <Eye className="mr-2 h-4 w-4" />
              상세 보기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openAccessModal(student)}>
              <Package className="mr-2 h-4 w-4" />
              패키지 배정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openGroupModal(student)}>
              <Users className="mr-2 h-4 w-4" />
              그룹 배정
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-[50px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="학생 관리"
        description="개별 학생 정보를 조회하고 패키지/그룹을 배정합니다."
      />

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="이름 또는 이메일로 검색..."
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

      {/* Student Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>학생 정보</DialogTitle>
            <DialogDescription>
              학생의 상세 정보를 확인합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedStudent.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground text-xs">전화번호</Label>
                  <p className="font-medium">{selectedStudent.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">가입일</Label>
                  <p className="font-medium">
                    {new Date(selectedStudent.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">마지막 접속</Label>
                  <p className="font-medium">
                    {selectedStudent.last_login_at
                      ? new Date(selectedStudent.last_login_at).toLocaleString("ko-KR")
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs">소속 그룹</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedStudent.groups.length > 0 ? (
                    selectedStudent.groups.map((group) => (
                      <Badge key={group.id} variant="secondary">
                        {group.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">소속 그룹 없음</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs">패키지 접근권한</Label>
                <p className="font-medium">{selectedStudent.package_access_count}개 패키지 이용 가능</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Access Modal */}
      <Dialog open={isAccessOpen} onOpenChange={setIsAccessOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>패키지 배정</DialogTitle>
            <DialogDescription>
              {selectedStudent?.name}님에게 패키지 접근권한을 부여합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>패키지 선택</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Label>이용 기간 (선택)</Label>
              </div>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddAccess} disabled={!selectedPackage || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              배정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Assignment Modal */}
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>그룹 배정</DialogTitle>
            <DialogDescription>
              {selectedStudent?.name}님을 그룹에 추가합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>그룹 선택</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="그룹을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter((g) => !selectedStudent?.groups.some((sg) => sg.id === g.id))
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddToGroup} disabled={!selectedGroup || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              배정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
