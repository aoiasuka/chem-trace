// 成员E：操作审计日志页面
import { Filter, ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ActionBadge({ action }: { action: string }) {
  if (action === "增") return <Badge variant="success">{action}</Badge>;
  if (action === "删") return <Badge variant="destructive">{action}</Badge>;
  if (action === "改") return <Badge variant="warning">{action}</Badge>;
  return <Badge variant="secondary">{action}</Badge>;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ operator?: string; module?: string; action?: string }>;
}) {
  const q = await searchParams;
  const logs = await prisma.auditLog.findMany({
    where: {
      operator: q.operator ? { contains: q.operator } : undefined,
      module: q.module || undefined,
      action: q.action || undefined,
    },
    orderBy: { opTime: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="操作审计日志"
        description="按操作人、模块、操作类型筛选历史记录"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="operator">操作人</Label>
              <Input
                id="operator"
                name="operator"
                defaultValue={q.operator}
                placeholder="操作人"
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label htmlFor="module">模块</Label>
              <Select id="module" name="module" defaultValue={q.module ?? ""}>
                <option value="">全部模块</option>
                <option value="基础信息">基础信息</option>
                <option value="入库">入库</option>
                <option value="领用归还">领用归还</option>
              </Select>
            </div>
            <div className="w-36 space-y-1.5">
              <Label htmlFor="action">操作</Label>
              <Select id="action" name="action" defaultValue={q.action ?? ""}>
                <option value="">全部操作</option>
                <option value="增">增</option>
                <option value="删">删</option>
                <option value="改">改</option>
                <option value="查">查</option>
              </Select>
            </div>
            <Button type="submit">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollText className="h-4 w-4" />
            共 {logs.length} 条日志
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
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {l.opTime.toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="font-medium">{l.operator}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {l.module}
                  </TableCell>
                  <TableCell className="text-center">
                    <ActionBadge action={l.action} />
                  </TableCell>
                  <TableCell
                    className="max-w-md truncate text-muted-foreground"
                    title={l.detail}
                  >
                    {l.detail}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    暂无日志
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
