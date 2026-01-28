"use client";

import { useState } from "react";
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
import { MoreHorizontal, Eye, Mail, Package, Users } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  target_score?: number;
  avatar_url?: string;
  groups: string[];
  package_count: number;
  last_login_at?: string;
  created_at: string;
}

// Mock data
const mockStudents: StudentRow[] = [
  {
    id: "1",
    name: "홍길동",
    email: "hong@example.com",
    phone: "010-1234-5678",
    target_score: 7.0,
    groups: ["2026년 1월 기초반"],
    package_count: 3,
    last_login_at: "2026-01-27 10:30",
    created_at: "2026-01-02",
  },
  {
    id: "2",
    name: "김철수",
    email: "kim@example.com",
    phone: "010-2345-6789",
    target_score: 6.5,
    groups: ["2026년 1월 중급반", "Writing 특강반"],
    package_count: 5,
    last_login_at: "2026-01-26 15:20",
    created_at: "2026-01-05",
  },
  {
    id: "3",
    name: "이영희",
    email: "lee@example.com",
    target_score: 8.0,
    groups: ["2025년 12월 심화반"],
    package_count: 2,
    last_login_at: "2026-01-25 09:15",
    created_at: "2025-12-10",
  },
  {
    id: "4",
    name: "박민수",
    email: "park@example.com",
    phone: "010-3456-7890",
    groups: [],
    package_count: 1,
    created_at: "2026-01-15",
  },
  {
    id: "5",
    name: "정수진",
    email: "jung@example.com",
    target_score: 7.5,
    groups: ["Writing 특강반"],
    package_count: 4,
    last_login_at: "2026-01-27 08:00",
    created_at: "2026-01-10",
  },
];

// Mock packages for access management
const mockPackages = [
  { id: "1", title: "IELTS 풀패키지 1회" },
  { id: "2", title: "IELTS 풀패키지 2회" },
  { id: "3", title: "Writing 단과 1회" },
  { id: "4", title: "Speaking 단과 1회" },
  { id: "5", title: "Listening 단과 1회" },
];

// Mock groups
const mockGroups = [
  { id: "1", name: "2026년 1월 기초반" },
  { id: "2", name: "2026년 1월 중급반" },
  { id: "3", name: "2025년 12월 심화반" },
  { id: "4", name: "Writing 특강반" },
];

export default function StudentsPage() {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const openDetailModal = (student: StudentRow) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const openAccessModal = (student: StudentRow) => {
    setSelectedStudent(student);
    setSelectedPackage("");
    setIsAccessOpen(true);
  };

  const openGroupModal = (student: StudentRow) => {
    setSelectedStudent(student);
    setSelectedGroup("");
    setIsGroupOpen(true);
  };

  const handleAddAccess = () => {
    // TODO: API 연동
    console.log("Add package access:", selectedStudent?.id, selectedPackage);
    setIsAccessOpen(false);
  };

  const handleAddToGroup = () => {
    // TODO: API 연동
    console.log("Add to group:", selectedStudent?.id, selectedGroup);
    setIsGroupOpen(false);
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
      key: "target_score",
      header: "목표 점수",
      cell: (student) => (
        <span className="text-muted-foreground">
          {student.target_score ? `Band ${student.target_score}` : "-"}
        </span>
      ),
    },
    {
      key: "groups",
      header: "소속 그룹",
      cell: (student) => (
        <div className="flex flex-wrap gap-1">
          {student.groups.length > 0 ? (
            student.groups.map((group, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {group}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">없음</span>
          )}
        </div>
      ),
    },
    {
      key: "package_count",
      header: "패키지",
      cell: (student) => (
        <span className="text-muted-foreground">{student.package_count}개</span>
      ),
    },
    {
      key: "last_login_at",
      header: "마지막 접속",
      cell: (student) => (
        <span className="text-muted-foreground text-sm">
          {student.last_login_at || "접속 기록 없음"}
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
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              이메일 발송
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
        description="개별 학생 정보를 조회하고 패키지/그룹을 배정합니다. 학생 계정은 WordPress SSO를 통해 자동 생성됩니다."
      />

      <DataTable
        columns={columns}
        data={mockStudents}
        searchPlaceholder="이름 또는 이메일로 검색..."
        totalItems={128}
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
                  <Label className="text-muted-foreground text-xs">목표 점수</Label>
                  <p className="font-medium">
                    {selectedStudent.target_score ? `Band ${selectedStudent.target_score}` : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">가입일</Label>
                  <p className="font-medium">{selectedStudent.created_at}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">마지막 접속</Label>
                  <p className="font-medium">{selectedStudent.last_login_at || "-"}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs">소속 그룹</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedStudent.groups.length > 0 ? (
                    selectedStudent.groups.map((group, idx) => (
                      <Badge key={idx} variant="secondary">
                        {group}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">소속 그룹 없음</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs">패키지 접근권한</Label>
                <p className="font-medium">{selectedStudent.package_count}개 패키지 이용 가능</p>
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
        <DialogContent className="max-w-[400px]">
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
                  {mockPackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddAccess} disabled={!selectedPackage}>
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
                  {mockGroups
                    .filter((g) => !selectedStudent?.groups.includes(g.name))
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
            <Button onClick={handleAddToGroup} disabled={!selectedGroup}>
              배정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
