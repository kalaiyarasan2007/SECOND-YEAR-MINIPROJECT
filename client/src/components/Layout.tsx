import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { usePendingAttendance } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Settings,
  ClipboardList,
  UserCircle,
  Clock,
  Loader2,
  CalendarClock
} from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function Layout({ children, roleRequired }: { children: ReactNode, roleRequired?: 'admin' | 'student' }) {
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const [location] = useLocation();
  const { data: pendingData } = usePendingAttendance();
  const pendingCount = (user?.role === 'admin' && Array.isArray(pendingData)) ? pendingData.length : 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (roleRequired && user.role !== roleRequired) {
    window.location.href = user.role === 'admin' ? "/admin" : "/student";
    return null;
  }

  const adminNav = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Pending Requests", url: "/admin/pending", icon: Clock, badge: pendingCount },
    { title: "Timetable", url: "/admin/timetable", icon: CalendarClock },
    { title: "Students", url: "/admin/students", icon: Users },
    { title: "Attendance", url: "/admin/attendance", icon: ClipboardList },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const studentNav = [
    { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  ];

  const navItems = user.role === 'admin' ? adminNav : studentNav;

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-secondary/30">
        <Sidebar className="border-r border-border bg-card">
          <SidebarContent>
            <div className="p-6 pb-2">
              <h1 className="font-display font-bold text-2xl text-gradient">GeoFace</h1>
              <p className="text-sm text-muted-foreground mt-1">Smart Attendance</p>
            </div>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location === item.url;
                    const badge = (item as any).badge;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} className={`rounded-xl mx-2 my-1 h-10 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                          <Link href={item.url} className="flex items-center gap-3 px-3 w-full">
                            <item.icon className="w-5 h-5" />
                            <span className="flex-1">{item.title}</span>
                            {badge > 0 && (
                              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                                {badge}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="p-4 mt-auto border-t border-border">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <UserCircle className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={() => logout.mutate(user.role)}
              disabled={logout.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

