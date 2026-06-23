import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "高校实验室危化品全流程追溯系统",
  description: "危化品采购-存储-领用-归还-废弃 闭环追溯",
};

const navItems = [
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
  // 预警数量徽标
  let warnCount = 0;
  if (session) {
    const chems = await prisma.chemical.findMany();
    warnCount = chems.filter((c) => c.currentQuantity < c.safeThreshold).length;
  }

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {session && (
          <header className="bg-slate-800 text-white shadow">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
              <span className="font-bold whitespace-nowrap">🧪 危化品追溯系统</span>
              <nav className="flex gap-4 text-sm">
                {navItems.map((it) => (
                  <Link key={it.href} href={it.href} className="hover:text-amber-300">
                    {it.label}
                    {it.href === "/warning" && warnCount > 0 && (
                      <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs">
                        {warnCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-3 text-sm">
                <span>{session.user?.name}</span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                >
                  <button className="rounded bg-slate-600 px-2 py-1 hover:bg-slate-500">
                    退出
                  </button>
                </form>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 mx-auto w-full max-w-6xl">{children}</main>
      </body>
    </html>
  );
}
