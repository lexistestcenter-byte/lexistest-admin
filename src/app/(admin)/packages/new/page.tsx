"use client";

import { useState } from "react";
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
  Trash2,
  Upload,
  GripVertical,
  Save,
  ArrowLeft,
  Search,
  Users,
  User,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";

// Mock sections data
const mockSections = [
  { id: "1", title: "Listening Section A", type: "listening", questionCount: 40, timeLimit: 30, isPractice: false },
  { id: "2", title: "Listening Section B", type: "listening", questionCount: 40, timeLimit: 30, isPractice: false },
  { id: "3", title: "Reading Passage 1 - Glass History", type: "reading", questionCount: 13, timeLimit: 20, isPractice: false },
  { id: "4", title: "Reading Passage 2 - Climate Change", type: "reading", questionCount: 13, timeLimit: 20, isPractice: false },
  { id: "5", title: "Reading Passage 3 - Technology", type: "reading", questionCount: 14, timeLimit: 20, isPractice: false },
  { id: "6", title: "Reading Practice Set", type: "reading", questionCount: 10, timeLimit: 15, isPractice: true },
  { id: "7", title: "Writing Section A", type: "writing", questionCount: 2, timeLimit: 60, isPractice: false },
  { id: "8", title: "Writing Practice", type: "writing", questionCount: 1, timeLimit: 30, isPractice: true },
  { id: "9", title: "Speaking Section A", type: "speaking", questionCount: 12, timeLimit: 14, isPractice: false },
  { id: "10", title: "Speaking Practice", type: "speaking", questionCount: 5, timeLimit: 7, isPractice: true },
];

// Mock groups data
const mockGroups = [
  { id: "1", name: "2026년 1월반", memberCount: 25 },
  { id: "2", name: "2026년 2월반", memberCount: 18 },
  { id: "3", name: "고급반 A", memberCount: 12 },
  { id: "4", name: "초급반 B", memberCount: 30 },
];

// Mock users data
const mockUsers = [
  { id: "1", name: "김철수", email: "kim@example.com" },
  { id: "2", name: "이영희", email: "lee@example.com" },
  { id: "3", name: "박민수", email: "park@example.com" },
  { id: "4", name: "정수연", email: "jung@example.com" },
];

const typeColors = {
  listening: "bg-white text-sky-500 border border-sky-300",
  reading: "bg-white text-emerald-500 border border-emerald-300",
  writing: "bg-white text-amber-500 border border-amber-300",
  speaking: "bg-white text-violet-500 border border-violet-300",
};

const typeLabels = {
  listening: "L",
  reading: "R",
  writing: "W",
  speaking: "S",
};

export default function NewPackagePage() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [examType, setExamType] = useState<string>("full");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isPublished, setIsPublished] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [isPractice, setIsPractice] = useState(false);

  // Access control
  const [accessType, setAccessType] = useState<string>("public");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filter sections
  const filteredSections = mockSections.filter(
    (s) =>
      (filterType === "all" || s.type === filterType) &&
      (searchQuery === "" || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const removeSection = (id: string) => {
    setSelectedSections((prev) => prev.filter((sId) => sId !== id));
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const selectedSectionDetails = mockSections.filter((s) =>
    selectedSections.includes(s.id)
  );

  // Calculate totals
  const totalQuestions = selectedSectionDetails.reduce((sum, s) => sum + s.questionCount, 0);
  const totalTime = selectedSectionDetails.reduce((sum, s) => sum + s.timeLimit, 0);

  // Section type summary
  const sectionSummary = selectedSectionDetails.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const showGroupSelect = accessType === "groups" || accessType === "groups_and_individuals";
  const showUserSelect = accessType === "individuals" || accessType === "groups_and_individuals";

  return (
    <div className="space-y-6">
      <PageHeader
        title="패키지 생성"
        description="섹션들을 조합하여 새로운 시험 패키지를 생성합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/packages">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Link>
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              저장
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
              <CardDescription>패키지의 기본 정보를 입력합니다.</CardDescription>
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
                  <Select>
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

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle>접근 권한 설정</CardTitle>
              <CardDescription>이 패키지를 볼 수 있는 대상을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>접근 유형</Label>
                <Select value={accessType} onValueChange={setAccessType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        전체 공개
                      </div>
                    </SelectItem>
                    <SelectItem value="groups">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        특정 그룹만
                      </div>
                    </SelectItem>
                    <SelectItem value="individuals">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        특정 사용자만
                      </div>
                    </SelectItem>
                    <SelectItem value="groups_and_individuals">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        그룹 + 사용자
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Selection */}
              {showGroupSelect && (
                <div className="space-y-2">
                  <Label>그룹 선택</Label>
                  <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                    {mockGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroup(group.id)}
                        />
                        <div className="flex-1">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({group.memberCount}명)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedGroups.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedGroups.length}개 그룹 선택됨
                    </p>
                  )}
                </div>
              )}

              {/* User Selection */}
              {showUserSelect && (
                <div className="space-y-2">
                  <Label>사용자 선택</Label>
                  <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                    {mockUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleUser(user.id)}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                        />
                        <div className="flex-1">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedUsers.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedUsers.length}명 선택됨
                    </p>
                  )}
                </div>
              )}

              {accessType === "public" && (
                <p className="text-sm text-muted-foreground">
                  모든 사용자가 이 패키지를 볼 수 있습니다.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이미지</CardTitle>
              <CardDescription>패키지 썸네일 이미지를 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  이미지를 업로드하세요
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG (권장: 800x600)
                </p>
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
                  <span className="font-medium">{selectedSections.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 문제 수</span>
                  <span className="font-medium">{totalQuestions}문제</span>
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
                        className={typeColors[type as keyof typeof typeColors]}
                      >
                        {typeLabels[type as keyof typeof typeLabels]}×{count}
                      </Badge>
                    ))}
                    {Object.keys(sectionSummary).length === 0 && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">유형</span>
                  <div className="flex gap-1">
                    {isPractice && <Badge variant="secondary">연습</Badge>}
                    {isFree && <Badge variant="outline" className="text-green-600">무료</Badge>}
                    {!isPractice && !isFree && <span className="text-sm">-</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">접근 권한</span>
                  <Badge variant="outline">
                    {accessType === "public" && "전체 공개"}
                    {accessType === "groups" && `${selectedGroups.length}개 그룹`}
                    {accessType === "individuals" && `${selectedUsers.length}명`}
                    {accessType === "groups_and_individuals" && `${selectedGroups.length}그룹 + ${selectedUsers.length}명`}
                  </Badge>
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

              <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>섹션명</TableHead>
                      <TableHead className="text-right">문제</TableHead>
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
                            checked={selectedSections.includes(section.id)}
                            onCheckedChange={() => toggleSection(section.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 text-xs rounded ${typeColors[section.type as keyof typeof typeColors]}`}>
                              {section.type.charAt(0).toUpperCase()}
                            </span>
                            {section.isPractice && (
                              <Badge variant="secondary" className="text-xs">연습</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{section.title}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {section.questionCount}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {section.timeLimit}분
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{filteredSections.length}개 섹션</span>
                <span>{selectedSections.length}개 선택됨</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected Sections */}
          <Card>
            <CardHeader>
              <CardTitle>선택된 섹션 ({selectedSections.length})</CardTitle>
              <CardDescription>드래그하여 순서를 변경할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSectionDetails.length > 0 ? (
                <div className="space-y-2">
                  {selectedSectionDetails.map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="text-sm font-medium w-6">{index + 1}.</span>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${typeColors[section.type as keyof typeof typeColors]}`}>
                          {section.type.charAt(0).toUpperCase()}
                        </span>
                        {section.isPractice && (
                          <Badge variant="secondary" className="text-xs">연습</Badge>
                        )}
                      </div>
                      <span className="flex-1 font-medium text-sm">{section.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {section.questionCount}문제 / {section.timeLimit}분
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
