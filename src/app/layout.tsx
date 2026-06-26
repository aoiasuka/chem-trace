import type { Metadata } from "next";
import { FlaskConical, LogOut } from "lucide-react";
import "./globals.css";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "高校实验室危化品全流程追溯系统",
  description: "危化品采购-存储-领用-归还-废弃 闭环追溯",
};

const navDefs = [
  { href: "/chemicals", label: "基础信息库" },
  { href: "/stock-in", label: "入库管理" },
  { href: "/operations", label: "领用归还" },
  { href: "/warning", label: "库存预警" },
  { href: "/audit", label: "审计日志" },
];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  let warnCount = 0;
  if (session) {
    const chems = await prisma.chemical.findMany();
    warnCount = chems.filter((c) => c.currentQuantity < c.safeThreshold).length;
  }

  const navItems = navDefs.map((it) =>
    it.href === "/warning" ? { ...it, warnCount } : it,
  );

  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-muted/30 text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {session && (
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
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    {session.user?.name}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
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
          {!session && (
            <div className="fixed right-4 top-4 z-40">
              <ThemeToggle />
            </div>
          )}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
