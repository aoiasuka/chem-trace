// 成员D：库存预警页面（按阈值比例分级展示）
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getWarningLevel,
  isWarning,
  WARNING_LEVELS,
  LEVEL_WEIGHT,
  type WarningLevel,
} from "@/lib/warning";

const rowTone: Record<WarningLevel, string> = {
  critical: "bg-destructive/10",
  below: "bg-destructive/5",
  low: "bg-warning/5",
  normal: "",
};

export default async function WarningPage() {
  const all = await prisma.chemical.findMany({ orderBy: { id: "asc" } });
  const list = all
    .map((c) => ({
      ...c,
      level: getWarningLevel(c.currentQuantity, c.safeThreshold),
      ratio:
        c.safeThreshold > 0
          ? Math.round((c.currentQuantity / c.safeThreshold) * 100)
          : 100,
    }))
    .sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level]);

  const warnCount = list.filter((c) => isWarning(c.currentQuantity, c.safeThreshold)).length;
  const criticalCount = list.filter((c) => c.level === "critical").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="库存预警"
        description="按库存占安全阈值的比例分级监控（充足 ≥100% / 偏低 80%-100% / 低于阈值 50%-80% / 严重不足 <50%）"
      />

      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-4",
          warnCount > 0
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : "border-success/30 bg-success/5 text-success",
        )}
      >
        {warnCount > 0 ? (
          <ShieldAlert className="h-5 w-5 shrink-0" />
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        )}
        <p className="text-sm font-medium">
          {warnCount > 0
            ? `当前有 ${warnCount} 种危化品库存低于安全阈值${
                criticalCount > 0 ? `，其中 ${criticalCount} 种严重不足，请立即补充！` : "，请及时关注。"
              }`
            : "所有危化品库存均在安全阈值以上。"}
        </p>
      </div>

      {/* 分级统计 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["critical", "below", "low", "normal"] as const).map((lv) => {
          const meta = WARNING_LEVELS[lv];
          const count = list.filter((c) => c.level === lv).length;
          return (
            <Card key={lv} className={cn(rowTone[lv] && "border-current/20")}>
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {lv === "critical" && <AlertTriangle className="h-3 w-3" />}
                  {lv === "below" && <ShieldAlert className="h-3 w-3" />}
                  {lv === "low" && <TrendingDown className="h-3 w-3" />}
                  {lv === "normal" && <CheckCircle2 className="h-3 w-3" />}
                  {meta.label}
                </span>
                <span className="text-2xl font-semibold tabular-nums">{count}</span>
                <span className="text-[11px] text-muted-foreground">{meta.desc}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>名称</TableHead>
                <TableHead className="text-center">类别</TableHead>
                <TableHead className="text-center">当前库存</TableHead>
                <TableHead className="text-center">安全阈值</TableHead>
                <TableHead className="text-center">占比</TableHead>
                <TableHead className="text-center">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => {
                const meta = WARNING_LEVELS[c.level];
                return (
                  <TableRow key={c.id} className={rowTone[c.level]}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {c.category}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-medium tabular-nums",
                        c.level !== "normal" && "text-destructive",
                      )}
                    >
                      {c.currentQuantity} {c.unit}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {c.safeThreshold} {c.unit}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {c.ratio}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={meta.badgeVariant}>
                        {c.level === "critical" && <AlertTriangle className="h-3 w-3" />}
                        {meta.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
