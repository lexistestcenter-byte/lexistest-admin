"use client";

import {
  GraduationCap,
  Package,
  Layers,
  FileQuestion,
  Ticket,
  ClipboardList,
  MessageSquareText,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Shield,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { hasPermission, ROLE_LABELS, AdminRole } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  // {
  //   title: "Overview",
  //   items: [
  //     {
  //       title: "대시보드",
  //       href: "/dashboard",
  //       icon: LayoutDashboard,
  //       permission: "dashboard",
  //     },
  //   ],
  // },
  {
    title: "Content Management",
    items: [
      {
        title: "문제 관리",
        href: "/questions",
        icon: FileQuestion,
        permission: "questions",
      },
      {
        title: "시험 관리",
        href: "/sections",
        icon: Layers,
        permission: "sections",
      },
      {
        title: "패키지 관리",
        href: "/packages",
        icon: Package,
        permission: "packages",
      },
      {
        title: "패키지 할당",
        href: "/assignments",
        icon: ClipboardCheck,
        permission: "coupons",
      },
    ],
  },
  {
    title: "Student Management",
    items: [
      {
        title: "학생 관리",
        href: "/students",
        icon: Users,
        permission: "students",
      },
      {
        title: "학생 그룹",
        href: "/groups",
        icon: GraduationCap,
        permission: "groups",
      },
      {
        title: "문의 관리",
        href: "/inquiries",
        icon: MessageSquareText,
        permission: "inquiries",
      },
    ],
  },
  {
    title: "Access & Coupons",
    items: [
      {
        title: "이용권 관리",
        href: "/coupons",
        icon: Ticket,
        permission: "coupons",
      },
    ],
  },
  {
    title: "Test & Scoring",
    items: [
      {
        title: "성적 관리",
        href: "/sessions",
        icon: ClipboardList,
        permission: "sessions",
      },
    ],
  },
  // {
  //   title: "Notifications & Logs",
  //   items: [
  //     {
  //       title: "알림 관리",
  //       href: "/notifications",
  //       icon: Bell,
  //       permission: "notifications",
  //     },
  //     {
  //       title: "활동 로그",
  //       href: "/logs",
  //       icon: Activity,
  //       permission: "logs",
  //     },
  //   ],
  // },
  {
    title: "System",
    items: [
      {
        title: "관리자 설정",
        href: "/settings/admins",
        icon: Shield,
        permission: "settings",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // 역할에 따라 메뉴 필터링
  const getFilteredNavigation = (role: AdminRole | undefined) => {
    if (!role) return [];

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => hasPermission(role, item.permission)),
      }))
      .filter((group) => group.items.length > 0);
  };

  const filteredNavigation = getFilteredNavigation(admin?.role);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">IELTS Admin</span>
            <span className="text-xs text-muted-foreground">관리자 시스템</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          filteredNavigation.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {isLoading ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : admin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-sidebar-accent rounded-lg transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={admin.avatar_url || undefined} />
                  <AvatarFallback>
                    {admin.name?.slice(0, 2).toUpperCase() || "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{admin.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[admin.role]}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{admin.name}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
