import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data
const stats = [
  {
    title: "전체 사용자",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "등록된 시험",
    value: "156",
    change: "+4",
    changeType: "positive" as const,
    icon: BookOpen,
  },
  {
    title: "이번 주 응시",
    value: "1,234",
    change: "+23.1%",
    changeType: "positive" as const,
    icon: ClipboardList,
  },
  {
    title: "평균 점수",
    value: "6.5",
    change: "+0.3",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const recentSessions = [
  {
    id: "1",
    user: "김철수",
    exam: "IELTS Academic Mock Test 1",
    status: "completed",
    score: 7.0,
    date: "2026-01-27 14:30",
  },
  {
    id: "2",
    user: "이영희",
    exam: "Listening Practice Set 3",
    status: "in_progress",
    score: null,
    date: "2026-01-27 14:15",
  },
  {
    id: "3",
    user: "박민수",
    exam: "Writing Task 2 Practice",
    status: "completed",
    score: 6.5,
    date: "2026-01-27 13:45",
  },
  {
    id: "4",
    user: "정수연",
    exam: "Speaking Practice Set 1",
    status: "abandoned",
    score: null,
    date: "2026-01-27 12:00",
  },
  {
    id: "5",
    user: "최동현",
    exam: "Reading Passage Practice",
    status: "completed",
    score: 7.5,
    date: "2026-01-27 11:30",
  },
];

const sectionAverages = [
  { section: "Listening", score: 6.8, color: "bg-blue-500" },
  { section: "Reading", score: 6.5, color: "bg-green-500" },
  { section: "Writing", score: 6.2, color: "bg-yellow-500" },
  { section: "Speaking", score: 6.4, color: "bg-purple-500" },
];

const recentActivities = [
  {
    id: "1",
    action: "새 시험 등록",
    description: "IELTS Academic Mock Test 15",
    user: "관리자",
    time: "5분 전",
  },
  {
    id: "2",
    action: "쿠폰 발급",
    description: "PREMIUM-2026-001 (10회 사용 가능)",
    user: "관리자",
    time: "15분 전",
  },
  {
    id: "3",
    action: "사용자 등록",
    description: "김새롬 (student)",
    user: "시스템",
    time: "1시간 전",
  },
  {
    id: "4",
    action: "AI 피드백 완료",
    description: "Writing Task 2 - 이영희",
    user: "시스템",
    time: "2시간 전",
  },
];

const statusBadgeVariant = {
  completed: "default",
  in_progress: "secondary",
  abandoned: "destructive",
} as const;

const statusLabel = {
  completed: "완료",
  in_progress: "진행중",
  abandoned: "중단",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          IELTS 시험 플랫폼 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {stat.change}
                </span>{" "}
                지난 주 대비
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Section Averages */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              섹션별 평균 점수
            </CardTitle>
            <CardDescription>
              이번 달 응시자들의 섹션별 평균 Band Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectionAverages.map((item) => (
                <div key={item.section} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{item.section}</div>
                  <div className="flex-1">
                    <div className="h-4 w-full rounded-full bg-muted">
                      <div
                        className={`h-4 rounded-full ${item.color}`}
                        style={{ width: `${(item.score / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-bold">
                    {item.score}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>최근 응시 현황</CardTitle>
          <CardDescription>최근 진행된 시험 응시 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>응시자</TableHead>
                <TableHead>시험</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>점수</TableHead>
                <TableHead>응시일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.user}</TableCell>
                  <TableCell>{session.exam}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusBadgeVariant[
                          session.status as keyof typeof statusBadgeVariant
                        ]
                      }
                    >
                      {
                        statusLabel[
                          session.status as keyof typeof statusLabel
                        ]
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.score !== null ? session.score.toFixed(1) : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
