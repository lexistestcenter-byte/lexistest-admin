import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <BreadcrumbProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="overflow-x-hidden">
            <Header />
            <main className="flex-1 overflow-x-auto p-6">
              <BreadcrumbNav />
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </BreadcrumbProvider>
    </ProtectedRoute>
  );
}
