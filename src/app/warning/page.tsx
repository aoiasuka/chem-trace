// 成员D：库存预警页面（低于安全阈值标红）
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function WarningPage() {
  const all = await prisma.chemical.findMany({ orderBy: { id: "asc" } });
  const list = all.map((c) => ({ ...c, warning: c.currentQuantity < c.safeThreshold }));
  const warnCount = list.filter((c) => c.warning).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="库存预警"
        description="实时监控危化品库存是否低于安全阈值"
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
            ? `当前有 ${warnCount} 种危化品库存低于安全阈值，请及时补充。`
            : "所有危化品库存均在安全阈值以上。"}
        </p>
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
                <TableHead className="text-center">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow
                  key={c.id}
                  className={c.warning ? "bg-destructive/5" : undefined}
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {c.category}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-medium tabular-nums",
                      c.warning && "text-destructive",
                    )}
                  >
                    {c.currentQuantity} {c.unit}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {c.safeThreshold} {c.unit}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.warning ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3" />
                        低于阈值
                      </Badge>
                    ) : (
                      <Badge variant="success">正常</Badge>
                    )}
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
