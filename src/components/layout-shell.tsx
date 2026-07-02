"use client";

// 布局外壳：根据当前路径决定渲染"带导航的正常布局"还是"全屏深色大屏布局"
// 解决 dashboard 不能有独立 html/body 的问题（Next.js App Router 仅允许根 layout 含 html/body）
import { usePathname } from "next/navigation";
import { FlaskConical, LogOut } from "lucide-react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Role, ROLE_LABELS, type NavItem } from "@/lib/permissions";

export function LayoutShell({
  children,
  navItems,
  role,
  userName,
  hasSession,
  onSignOut,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  role?: Role;
  userName?: string | null;
  hasSession: boolean;
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // 大屏路由：全屏深色容器，无导航栏，覆盖 body 背景
  if (isDashboard) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-[#0a0f1c] via-[#0d1526] to-[#0a1225] text-white">
        {/* 背景装饰网格 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    );
  }

  // 正常布局：带顶部导航
  return (
    <>
      {hasSession && (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FlaskConical className="h-4 w-4" />
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">
                危化品追溯系统
              </span>
            </div>
            <div className="mx-2 h-5 w-px bg-border" />
            <Nav items={navItems} />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              {role && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {ROLE_LABELS[role]}
                </Badge>
              )}
              <span className="hidden text-sm text-muted-foreground md:inline">
                {userName}
              </span>
              <form action={onSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  退出
                </Button>
              </form>
            </div>
          </div>
        </header>
      )}
      {!hasSession && (
        <div className="fixed right-4 top-4 z-40">
          <ThemeToggle />
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
