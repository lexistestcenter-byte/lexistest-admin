"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2, Users, UserPlus, Plus, Search, X, Loader2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

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

interface GroupsResponse {
  groups: GroupRow[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface MembersResponse {
  members: Student[];
}

interface UsersResponse {
  users: Student[];
  pagination: {
    total: number;
  };
}

const PAGE_SIZE = 10;

export default function GroupsPage() {
  // List state
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Members management (edit modal)
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupMembers, setGroupMembers] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // Create modal student selection
  const [createMemberSearch, setCreateMemberSearch] = useState("");
  const [createSelectedStudents, setCreateSelectedStudents] = useState<Student[]>([]);
  const [createAvailableStudents, setCreateAvailableStudents] = useState<Student[]>([]);
  const [isCreateStudentsLoading, setIsCreateStudentsLoading] = useState(false);

  // Load groups
  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", PAGE_SIZE.toString());
      params.set("offset", ((currentPage - 1) * PAGE_SIZE).toString());
      if (search) params.set("search", search);

      const { data, error } = await api.get<GroupsResponse>(`/api/groups?${params.toString()}`);

      if (error) throw new Error(error);

      setGroups(data?.groups || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("그룹 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load group members
  const loadGroupMembers = async (groupId: string) => {
    setIsMembersLoading(true);
    try {
      const { data, error } = await api.get<MembersResponse>(`/api/groups/${groupId}/members`);
      if (error) throw new Error(error);
      setGroupMembers(data?.members || []);
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("그룹 멤버를 불러오는데 실패했습니다.");
      setGroupMembers([]);
    } finally {
      setIsMembersLoading(false);
    }
  };

  // Search available students
  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAvailableStudents([]);
      return;
    }
    setIsStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("limit", "20");

      const { data, error } = await api.get<UsersResponse>(`/api/users?${params.toString()}`);
      if (error) throw new Error(error);
      setAvailableStudents(data?.users || []);
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setIsStudentsLoading(false);
    }
  }, []);

  // Debounced student search (edit modal)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStudents(memberSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, searchStudents]);

  // Search students for create modal
  const searchCreateStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCreateAvailableStudents([]);
      return;
    }
    setIsCreateStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("limit", "20");

      const { data, error } = await api.get<UsersResponse>(`/api/users?${params.toString()}`);
      if (error) throw new Error(error);
      setCreateAvailableStudents(data?.users || []);
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setIsCreateStudentsLoading(false);
    }
  }, []);

  // Debounced student search (create modal)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCreateStudents(createMemberSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [createMemberSearch, searchCreateStudents]);

  const toggleCreateStudent = (student: Student) => {
    setCreateSelectedStudents((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  };

  const removeCreateStudent = (studentId: string) => {
    setCreateSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setMemberSearch("");
    setSelectedStudents([]);
    setGroupMembers([]);
    setAvailableStudents([]);
    setCreateMemberSearch("");
    setCreateSelectedStudents([]);
    setCreateAvailableStudents([]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const { data, error } = await api.post<{ group: { id: string } }>("/api/groups", {
        name: name.trim(),
        description: description.trim() || null,
      });
      if (error) throw new Error(error);

      // Add selected students if any
      if (createSelectedStudents.length > 0 && data?.group?.id) {
        const { error: membersError } = await api.post(`/api/groups/${data.group.id}/members`, {
          user_ids: createSelectedStudents.map((s) => s.id),
        });
        if (membersError) {
          toast.warning("그룹은 생성되었지만 학생 추가에 실패했습니다.");
        }
      }

      toast.success("그룹이 생성되었습니다.");
      setIsCreateOpen(false);
      resetForm();
      loadGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("그룹 생성에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGroup || !name.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await api.put(`/api/groups/${selectedGroup.id}`, {
        name: name.trim(),
        description: description.trim() || null,
      });
      if (error) throw new Error(error);

      toast.success("그룹이 수정되었습니다.");
      setIsEditOpen(false);
      resetForm();
      loadGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("그룹 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    setIsSaving(true);
    try {
      const { error } = await api.delete(`/api/groups/${selectedGroup.id}`);
      if (error) throw new Error(error);

      toast.success("그룹이 삭제되었습니다.");
      setIsDeleteConfirmOpen(false);
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("그룹 삭제에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = async (group: GroupRow) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description || "");
    setSelectedStudents([]);
    setMemberSearch("");
    setAvailableStudents([]);
    setIsEditOpen(true);
    await loadGroupMembers(group.id);
  };

  const openDeleteConfirm = (group: GroupRow) => {
    setSelectedGroup(group);
    setIsDeleteConfirmOpen(true);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const addSelectedStudents = async () => {
    if (!selectedGroup || selectedStudents.length === 0) return;
    try {
      const { error } = await api.post(`/api/groups/${selectedGroup.id}/members`, {
        user_ids: selectedStudents,
      });
      if (error) throw new Error(error);

      toast.success(`${selectedStudents.length}명이 추가되었습니다.`);
      setSelectedStudents([]);
      await loadGroupMembers(selectedGroup.id);
      loadGroups(); // member_count 갱신
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("멤버 추가에 실패했습니다.");
    }
  };

  const removeFromGroup = async (studentId: string) => {
    if (!selectedGroup) return;
    try {
      const { error } = await api.delete(`/api/groups/${selectedGroup.id}/members/${studentId}`);
      if (error) throw new Error(error);

      setGroupMembers((prev) => prev.filter((m) => m.id !== studentId));
      loadGroups(); // member_count 갱신
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("멤버 제거에 실패했습니다.");
    }
  };

  // 이미 그룹에 있는 학생 제외
  const memberIds = new Set(groupMembers.map((m) => m.id));
  const filteredStudents = availableStudents.filter((s) => !memberIds.has(s.id));

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
        <span className="text-muted-foreground">
          {new Date(group.created_at).toLocaleDateString("ko-KR")}
        </span>
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
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => openDeleteConfirm(group)}
            >
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
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            그룹 생성
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={groups}
        searchPlaceholder="그룹명으로 검색..."
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
        onSearch={setSearch}
        onPageChange={setCurrentPage}
      />

      {/* Create Group Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">그룹 생성</DialogTitle>
            <DialogDescription>
              새로운 학생 그룹을 생성하고 학생을 추가합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Section 1: Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <FolderPlus className="h-3.5 w-3.5 text-primary" />
                </div>
                <Label className="text-sm font-semibold">기본 정보</Label>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="그룹명 *  예: 2026년 2월 기초반"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                  placeholder="그룹에 대한 설명을 입력하세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t" />

            {/* Section 2: Student Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                </div>
                <Label className="text-sm font-semibold">학생 추가</Label>
                <span className="text-xs text-muted-foreground">(선택사항)</span>
              </div>

              {/* Selected Students Chips */}
              {createSelectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {createSelectedStudents.map((student) => (
                    <Badge
                      key={student.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 gap-1"
                    >
                      <span className="text-xs">{student.name}</span>
                      <button
                        type="button"
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        onClick={() => removeCreateStudent(student.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground self-center ml-1">
                    {createSelectedStudents.length}명 선택됨
                  </span>
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름 또는 이메일로 검색..."
                  className="pl-9"
                  value={createMemberSearch}
                  onChange={(e) => setCreateMemberSearch(e.target.value)}
                />
              </div>

              {/* Search Results */}
              <div className="border rounded-lg max-h-[180px] overflow-y-auto">
                {isCreateStudentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">검색중...</span>
                  </div>
                ) : createMemberSearch.trim() === "" ? (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    학생을 검색해주세요.
                  </div>
                ) : createAvailableStudents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>이메일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {createAvailableStudents.map((student) => (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer"
                          onClick={() => toggleCreateStudent(student)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={createSelectedStudents.some((s) => s.id === student.id)}
                              onCheckedChange={() => toggleCreateStudent(student)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-muted-foreground">{student.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성{createSelectedStudents.length > 0 && ` (${createSelectedStudents.length}명 포함)`}
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
                <Label htmlFor="edit-name">그룹명 <span className="text-red-500">*</span></Label>
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
                      placeholder="이름 또는 이메일로 검색..."
                      className="pl-9"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
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
                  {isStudentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">검색중...</span>
                    </div>
                  ) : memberSearch.trim() === "" ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      학생을 검색해주세요.
                    </div>
                  ) : (
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
                              검색 결과가 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              {/* Current Members Section */}
              <div className="space-y-2 mt-4">
                <Label>그룹 학생 ({groupMembers.length}명)</Label>
                <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                  {isMembersLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">로딩중...</span>
                    </div>
                  ) : groupMembers.length > 0 ? (
                    <div className="divide-y">
                      {groupMembers.map((student) => (
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
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>그룹 삭제</DialogTitle>
            <DialogDescription>
              &ldquo;{selectedGroup?.name}&rdquo; 그룹을 삭제하시겠습니까?
              그룹에 속한 학생들의 그룹 배정이 해제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
