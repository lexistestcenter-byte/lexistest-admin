"use client";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sections = [
  { id: "listening", label: "Listening", defaultTime: 30 },
  { id: "reading", label: "Reading", defaultTime: 60 },
  { id: "writing", label: "Writing", defaultTime: 60 },
  { id: "speaking", label: "Speaking", defaultTime: 14 },
];

export default function NewExamPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="시험 등록" description="새로운 시험을 등록합니다." />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="sections">섹션 구성</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <form className="space-y-6 mt-6">
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>
                  시험의 기본 정보를 입력해주세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">시험명 *</Label>
                    <Input
                      id="title"
                      placeholder="IELTS Academic Mock Test 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam_type">유형 *</Label>
                    <Select defaultValue="full">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">풀시험 (L+R+W+S)</SelectItem>
                        <SelectItem value="section_only">섹션별 시험</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">난이도</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">쉬움</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="hard">어려움</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">썸네일 URL</Label>
                    <Input id="thumbnail" placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="시험에 대한 설명을 입력하세요..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections">
            <Card>
              <CardHeader>
                <CardTitle>섹션 구성</CardTitle>
                <CardDescription>
                  시험에 포함될 섹션을 선택하고 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <Checkbox id={section.id} defaultChecked />
                    <div className="flex-1 space-y-4">
                      <Label
                        htmlFor={section.id}
                        className="text-base font-medium"
                      >
                        {section.label}
                      </Label>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`${section.id}_time`}>
                            제한 시간 (분)
                          </Label>
                          <Input
                            id={`${section.id}_time`}
                            type="number"
                            defaultValue={section.defaultTime}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${section.id}_title`}>
                            섹션 제목 (선택)
                          </Label>
                          <Input
                            id={`${section.id}_title`}
                            placeholder="기본값 사용"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${section.id}_questions`}>
                            문제 수
                          </Label>
                          <Input
                            id={`${section.id}_questions`}
                            type="number"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>공개 설정</CardTitle>
                <CardDescription>
                  시험의 공개 여부와 접근 권한을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">공개 상태</Label>
                    <p className="text-sm text-muted-foreground">
                      공개 시 접근 권한이 있는 사용자가 응시할 수 있습니다.
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">무료 체험</Label>
                    <p className="text-sm text-muted-foreground">
                      무료 체험 시험으로 설정하면 모든 사용자가 응시할 수
                      있습니다.
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">패키지 상품</Label>
                    <p className="text-sm text-muted-foreground">
                      여러 시험을 묶어서 패키지로 판매합니다.
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/exams">취소</Link>
            </Button>
            <Button variant="secondary">임시저장</Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
