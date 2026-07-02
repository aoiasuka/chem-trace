import type { Metadata } from "next";
import "./globals.css";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutShell } from "@/components/layout-shell";
import {
  type Role,
  NAV_ITEMS,
  hasPermission,
} from "@/lib/permissions";
import { isWarning } from "@/lib/warning";

export const metadata: Metadata = {
  title: "高校实验室危化品全流程追溯系统",
  description: "危化品采购-存储-领用-归还-废弃 闭环追溯",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role as
    | Role
    | undefined;

  // 计算预警角标
  let warnCount = 0;
  if (session) {
    const chems = await prisma.chemical.findMany();
    warnCount = chems.filter((c) => isWarning(c.currentQuantity, c.safeThreshold)).length;
  }

  // 按当前用户角色过滤可见导航项
  const navItems = NAV_ITEMS.filter((it) => hasPermission(role, it.roles)).map(
    (it) => (it.href === "/warning" ? { ...it, warnCount } : it),
  );

  // 退出登录 server action（传给客户端 LayoutShell）
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-muted/30 text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutShell
            navItems={navItems}
            role={role}
            userName={session?.user?.name}
            hasSession={!!session}
            onSignOut={handleSignOut}
          >
            {children}
          </LayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
