"use client";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Info } from "lucide-react";

// Mock data for band conversion
const listeningConversion = [
  { rawMin: 39, rawMax: 40, band: 9.0 },
  { rawMin: 37, rawMax: 38, band: 8.5 },
  { rawMin: 35, rawMax: 36, band: 8.0 },
  { rawMin: 33, rawMax: 34, band: 7.5 },
  { rawMin: 30, rawMax: 32, band: 7.0 },
  { rawMin: 27, rawMax: 29, band: 6.5 },
  { rawMin: 23, rawMax: 26, band: 6.0 },
  { rawMin: 20, rawMax: 22, band: 5.5 },
  { rawMin: 16, rawMax: 19, band: 5.0 },
];

const readingConversion = [
  { rawMin: 39, rawMax: 40, band: 9.0 },
  { rawMin: 37, rawMax: 38, band: 8.5 },
  { rawMin: 35, rawMax: 36, band: 8.0 },
  { rawMin: 33, rawMax: 34, band: 7.5 },
  { rawMin: 30, rawMax: 32, band: 7.0 },
  { rawMin: 27, rawMax: 29, band: 6.5 },
  { rawMin: 23, rawMax: 26, band: 6.0 },
  { rawMin: 19, rawMax: 22, band: 5.5 },
  { rawMin: 15, rawMax: 18, band: 5.0 },
];

const writingCriteria = [
  { code: "TA/TR", name: "Task Achievement / Task Response", weight: "25%" },
  { code: "CC", name: "Coherence and Cohesion", weight: "25%" },
  { code: "LR", name: "Lexical Resource", weight: "25%" },
  { code: "GA", name: "Grammatical Range and Accuracy", weight: "25%" },
];

const speakingCriteria = [
  { code: "FC", name: "Fluency and Coherence", weight: "25%" },
  { code: "LR", name: "Lexical Resource", weight: "25%" },
  { code: "GA", name: "Grammatical Range and Accuracy", weight: "25%" },
  { code: "PR", name: "Pronunciation", weight: "25%" },
];

export default function ScoringRulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="채점 설정"
        description="IELTS Band Score 환산표와 채점 기준을 관리합니다."
      />

      <Tabs defaultValue="conversion">
        <TabsList>
          <TabsTrigger value="conversion">점수 환산표</TabsTrigger>
          <TabsTrigger value="criteria">채점 기준</TabsTrigger>
          <TabsTrigger value="overall">Overall 계산</TabsTrigger>
        </TabsList>

        <TabsContent value="conversion" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Listening 환산표</CardTitle>
                  <CardDescription>Academic / General Training</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>원점수</TableHead>
                      <TableHead className="text-right">Band Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listeningConversion.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {row.rawMin === row.rawMax
                            ? row.rawMin
                            : `${row.rawMin}-${row.rawMax}`}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {row.band.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Reading 환산표</CardTitle>
                  <CardDescription>Academic</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>원점수</TableHead>
                      <TableHead className="text-right">Band Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readingConversion.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {row.rawMin === row.rawMax
                            ? row.rawMin
                            : `${row.rawMin}-${row.rawMax}`}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {row.band.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="criteria" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Writing 채점 기준</CardTitle>
                  <CardDescription>4대 평가 기준</CardDescription>
                </div>
                <Badge>활성</Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>기준</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="text-right">가중치</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {writingCriteria.map((criterion) => (
                      <TableRow key={criterion.code}>
                        <TableCell className="font-medium">
                          {criterion.code}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {criterion.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {criterion.weight}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">점수 계산 규칙</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Task Score = (TA+CC+LR+GA)/4 → 0.5 내림</li>
                    <li>Writing Score = (Task1 + Task2×2)/3 → 0.25 반올림</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Speaking 채점 기준</CardTitle>
                  <CardDescription>4대 평가 기준</CardDescription>
                </div>
                <Badge>활성</Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>기준</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="text-right">가중치</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {speakingCriteria.map((criterion) => (
                      <TableRow key={criterion.code}>
                        <TableCell className="font-medium">
                          {criterion.code}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {criterion.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {criterion.weight}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">점수 계산 규칙</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Speaking Score = (FC+LR+GA+PR)/4 → 0.5 내림</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overall" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Band Score 계산</CardTitle>
              <CardDescription>
                전체 점수 계산 방식을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">계산 공식</h4>
                <div className="space-y-2 font-mono text-sm">
                  <p>Overall = (Listening + Reading + Writing + Speaking) / 4</p>
                  <p className="text-muted-foreground">
                    → 0.25 단위로 반올림
                  </p>
                </div>
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-3">반올림 예시</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>6.1 ~ 6.24 → 6.0</div>
                    <div>6.25 ~ 6.49 → 6.5</div>
                    <div>6.5 ~ 6.74 → 6.5</div>
                    <div>6.75 ~ 6.99 → 7.0</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
