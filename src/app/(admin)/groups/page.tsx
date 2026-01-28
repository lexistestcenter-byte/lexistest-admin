"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Pencil, Trash2, Users, UserPlus, Plus, Search, X } from "lucide-react";

interface GroupRow {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

// Mock data
const mockGroups: GroupRow[] = [
  {
    id: "1",
    name: "2026년 1월 기초반",
    description: "IELTS 기초 과정 학생들",
    member_count: 15,
    created_at: "2026-01-02",
  },
  {
    id: "2",
    name: "2026년 1월 중급반",
    description: "IELTS 중급 과정 학생들",
    member_count: 12,
    created_at: "2026-01-02",
  },
  {
    id: "3",
    name: "2025년 12월 심화반",
    description: "Band 7+ 목표 학생들",
    member_count: 8,
    created_at: "2025-12-01",
  },
  {
    id: "4",
    name: "Writing 특강반",
    description: "Writing Task 2 집중 과정",
    member_count: 20,
    created_at: "2026-01-15",
  },
];

// Mock students
const mockStudents: Student[] = [
  { id: "1", name: "홍길동", email: "hong@example.com" },
  { id: "2", name: "김철수", email: "kim@example.com" },
  { id: "3", name: "이영희", email: "lee@example.com" },
  { id: "4", name: "박민수", email: "park@example.com" },
  { id: "5", name: "정수진", email: "jung@example.com" },
  { id: "6", name: "최현우", email: "choi@example.com" },
  { id: "7", name: "강서연", email: "kang@example.com" },
  { id: "8", name: "윤지호", email: "yoon@example.com" },
];

export default function GroupsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Members management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSearchQuery("");
    setSelectedStudents([]);
    setGroupMembers([]);
  };

  const handleCreate = () => {
    // TODO: API 연동
    console.log({ name, description });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleSave = () => {
    // TODO: API 연동
    console.log({
      id: selectedGroup?.id,
      name,
      description,
      members: groupMembers,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const openEditModal = (group: GroupRow) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description || "");
    setGroupMembers(["1", "2", "3"]); // TODO: 실제 그룹 멤버 로드
    setSelectedStudents([]);
    setSearchQuery("");
    setIsEditOpen(true);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const addSelectedStudents = () => {
    setGroupMembers((prev) => [...prev, ...selectedStudents]);
    setSelectedStudents([]);
  };

  const removeFromGroup = (studentId: string) => {
    setGroupMembers((prev) => prev.filter((id) => id !== studentId));
  };

  const filteredStudents = mockStudents.filter(
    (student) =>
      !groupMembers.includes(student.id) &&
      (searchQuery === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupMemberDetails = mockStudents.filter((s) =>
    groupMembers.includes(s.id)
  );

  const columns: Column<GroupRow>[] = [
    {
      key: "name",
      header: "그룹명",
      cell: (group) => (
        <div
          className="cursor-pointer hover:text-primary"
          onClick={() => openEditModal(group)}
        >
          <div className="font-medium">{group.name}</div>
          {group.description && (
            <div className="text-sm text-muted-foreground">
              {group.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "members",
      header: "학생 수",
      cell: (group) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {group.member_count}명
        </div>
      ),
    },
    {
      key: "created_at",
      header: "생성일",
      cell: (group) => (
        <span className="text-muted-foreground">{group.created_at}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (group) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openEditModal(group)}>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="학생 그룹"
        description="학생 그룹(반, 클래스)을 관리합니다. 그룹에 학생을 추가하고 패키지를 배정할 수 있습니다."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            그룹 생성
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockGroups}
        searchPlaceholder="그룹명으로 검색..."
        totalItems={45}
      />

      {/* Create Group Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>그룹 생성</DialogTitle>
            <DialogDescription>
              새로운 학생 그룹을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">그룹명 *</Label>
              <Input
                id="create-name"
                placeholder="예: 2026년 2월 기초반"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">설명</Label>
              <Textarea
                id="create-description"
                placeholder="그룹에 대한 설명을 입력하세요..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>그룹 수정</DialogTitle>
            <DialogDescription>
              그룹 정보를 수정하고 학생을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">그룹명 *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">설명</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              {/* Add Students Section */}
              <div className="space-y-2">
                <Label>학생 추가</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="학생 검색..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={addSelectedStudents}
                    disabled={selectedStudents.length === 0}
                    size="sm"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    추가 ({selectedStudents.length})
                  </Button>
                </div>

                {/* Available Students */}
                <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>이메일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <TableRow
                            key={student.id}
                            className="cursor-pointer"
                            onClick={() => toggleStudent(student.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => toggleStudent(student.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-muted-foreground">{student.email}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            추가할 학생이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Current Members Section */}
              <div className="space-y-2 mt-4">
                <Label>그룹 학생 ({groupMemberDetails.length}명)</Label>
                <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                  {groupMemberDetails.length > 0 ? (
                    <div className="divide-y">
                      {groupMemberDetails.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between px-4 py-2"
                        >
                          <div>
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">{student.email}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromGroup(student.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      그룹에 학생이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
