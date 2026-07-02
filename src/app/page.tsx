// 仪表盘首页（按角色展示统计概览与快捷操作）
import Link from "next/link";
import {
  FlaskConical,
  ShieldAlert,
  PackagePlus,
  ArrowRightLeft,
  Activity,
  Users,
  ScrollText,
  AlertTriangle,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Role,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  hasPermission,
} from "@/lib/permissions";
import {
  getWarningLevel,
  WARNING_LEVELS,
  isWarning,
} from "@/lib/warning";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone: "default" | "destructive" | "success" | "warning";
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint ? (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40 hover:bg-accent/40">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role as Role;

  // —— 聚合数据 ——
  const chemicals = await prisma.chemical.findMany();
  const totalChemicals = chemicals.length;
  const warningList = chemicals.filter((c) =>
    isWarning(c.currentQuantity, c.safeThreshold),
  );

  // 预警分级统计
  const levelCount = { normal: 0, low: 0, below: 0, critical: 0 } as Record<
    string,
    number
  >;
  for (const c of chemicals) {
    levelCount[getWarningLevel(c.currentQuantity, c.safeThreshold)]++;
  }

  // 按类别统计
  const byCategory: Record<string, number> = {};
  for (const c of chemicals) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  }

  const today = startOfToday();
  const [todayStockIn, todayOps, recentAudits] = await Promise.all([
    prisma.stockIn.findMany({
      where: { inDate: { gte: today } },
      include: { chemical: true },
      orderBy: { inDate: "desc" },
      take: 5,
    }),
    prisma.opLog.findMany({
      where: { opTime: { gte: today } },
      include: { chemical: true },
      orderBy: { opTime: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      orderBy: { opTime: "desc" },
      take: 8,
    }),
  ]);

  const todayStockInQty = todayStockIn.reduce((s, x) => s + x.inQuantity, 0);

  // 角色快捷入口
  const quickActions: { href: string; icon: LucideIcon; label: string; desc: string }[] = [];
  if (hasPermission(role, ["ADMIN"])) {
    quickActions.push(
      { href: "/admin/users", icon: Users, label: "用户管理", desc: "维护账号与角色" },
      { href: "/chemicals", icon: ClipboardList, label: "基础数据维护", desc: "危化品信息库" },
      { href: "/audit", icon: ScrollText, label: "审计查看", desc: "操作日志检索" },
    );
  }
  if (hasPermission(role, ["WAREHOUSE"])) {
    quickActions.push(
      { href: "/stock-in", icon: PackagePlus, label: "入库登记", desc: "采购批次入库" },
      { href: "/chemicals", icon: ArrowRightLeft, label: "库存调整", desc: "盘点修正库存" },
    );
  }
  if (hasPermission(role, ["RESEARCHER"])) {
    quickActions.push(
      { href: "/operations", icon: ArrowRightLeft, label: "领用登记", desc: "领用危化品" },
      { href: "/operations", icon: ArrowRightLeft, label: "归还登记", desc: "归还危化品" },
    );
  }
  if (hasPermission(role, ["SAFETY"])) {
    quickActions.push(
      { href: "/warning", icon: ShieldAlert, label: "库存预警", desc: "阈值分级监控" },
      { href: "/audit", icon: ScrollText, label: "审计查看", desc: "操作日志检索" },
      { href: "/operations", icon: AlertTriangle, label: "废弃审批", desc: "危化品废弃处置" },
    );
  }

  const categoryMax = Math.max(1, ...Object.values(byCategory));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`欢迎，${session.user.name ?? "用户"}`}
        description={`${ROLE_LABELS[role]} · ${ROLE_DESCRIPTIONS[role]}`}
        action={
          <Button asChild size="sm" variant="default" className="gap-1.5">
            <Link href="/dashboard">
              <Activity className="h-3.5 w-3.5" />
              实时概览
              <span className="text-[10px] opacity-60">→ 大屏</span>
            </Link>
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FlaskConical}
          label="危化品种类"
          value={totalChemicals}
          hint={`共 ${Object.keys(byCategory).length} 个类别`}
          tone="default"
        />
        <StatCard
          icon={ShieldAlert}
          label="库存预警"
          value={warningList.length}
          hint={
            levelCount.critical > 0
              ? `严重不足 ${levelCount.critical} 种`
              : "请关注库存补充"
          }
          tone={warningList.length > 0 ? "destructive" : "success"}
        />
        <StatCard
          icon={PackagePlus}
          label="今日入库"
          value={todayStockIn.length}
          hint={`合计 ${todayStockInQty}`}
          tone="success"
        />
        <StatCard
          icon={ArrowRightLeft}
          label="今日领用/归还"
          value={todayOps.length}
          hint="今日操作流水"
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 库存预警分级 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              库存预警分级
            </CardTitle>
            <CardDescription>
              依据当前库存占安全阈值的比例划分
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["critical", "below", "low", "normal"] as const).map((lv) => {
              const meta = WARNING_LEVELS[lv];
              const count = levelCount[lv];
              const pct =
                totalChemicals > 0
                  ? Math.round((count / totalChemicals) * 100)
                  : 0;
              const barColor = {
                critical: "bg-destructive",
                below: "bg-destructive/70",
                low: "bg-warning",
                normal: "bg-success",
              }[lv];
              return (
                <div key={lv} className="flex items-center gap-3">
                  <Badge variant={meta.badgeVariant} className="w-20 justify-center">
                    {meta.label}
                  </Badge>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
                    {count} 种 · {pct}%
                  </span>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-muted-foreground">
              分级标准：充足 ≥100% · 偏低 80%-100% · 低于阈值 50%-80% · 严重不足 &lt;50%
            </p>
          </CardContent>
        </Card>

        {/* 类别分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FlaskConical className="h-4 w-4" />
              危化品类别分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byCategory).map(([cat, n]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-16 text-sm text-muted-foreground">{cat}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary/60"
                    style={{ width: `${(n / categoryMax) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">
                  {n} 种
                </span>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                暂无危化品数据
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((a, i) => (
                <ActionLink key={`${a.href}-${i}`} {...a} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近活动 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollText className="h-4 w-4" />
            最近操作审计
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead className="text-center">模块</TableHead>
                <TableHead className="text-center">操作</TableHead>
                <TableHead>详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAudits.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {l.opTime.toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="font-medium">{l.operator}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {l.module}
                  </TableCell>
                  <TableCell className="text-center">{l.action}</TableCell>
                  <TableCell
                    className="max-w-sm truncate text-muted-foreground"
                    title={l.detail}
                  >
                    {l.detail}
                  </TableCell>
                </TableRow>
              ))}
              {recentAudits.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-20 text-center text-muted-foreground"
                  >
                    暂无审计记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {hasPermission(role, ["ADMIN", "SAFETY"]) && (
            <div className="border-t p-3 text-right">
              <Button asChild variant="ghost" size="sm">
                <Link href="/audit">查看全部审计日志</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
