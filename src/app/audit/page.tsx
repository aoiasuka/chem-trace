// 成员E：操作审计日志页面（增强：时间范围 + 详情搜索 + 成功失败筛选 + 分页）
import { Filter, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
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
import type { Prisma } from "../../generated/prisma";

function ActionBadge({ action }: { action: string }) {
  if (action === "增") return <Badge variant="success">{action}</Badge>;
  if (action === "删") return <Badge variant="destructive">{action}</Badge>;
  if (action === "改") return <Badge variant="warning">{action}</Badge>;
  return <Badge variant="secondary">{action}</Badge>;
}

const PAGE_SIZE = 20;
const FAIL_PREFIX = "[失败]";

type AuditQuery = {
  operator?: string;
  module?: string;
  action?: string;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<AuditQuery>;
}) {
  const q = await searchParams;
  const page = Math.max(1, Number(q.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // 组装查询条件
  const where: Prisma.AuditLogWhereInput = {
    operator: q.operator ? { contains: q.operator } : undefined,
    module: q.module || undefined,
    action: q.action || undefined,
    detail: q.keyword ? { contains: q.keyword } : undefined,
    opTime: {
      gte: q.startDate ? new Date(`${q.startDate}T00:00:00`) : undefined,
      lte: q.endDate ? new Date(`${q.endDate}T23:59:59`) : undefined,
    },
  };
  // 成功/失败状态筛选（依据 detail 是否以 [失败] 开头）
  if (q.status === "失败") {
    where.AND = [{ detail: { startsWith: FAIL_PREFIX } }];
  } else if (q.status === "成功") {
    where.AND = [{ NOT: { detail: { startsWith: FAIL_PREFIX } } }];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { opTime: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // 构建分页链接（保留筛选参数）
  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v && k !== "page") params.set(k, v);
    }
    params.set("page", String(p));
    return `/audit?${params.toString()}`;
  }

  // 失败数统计（用于筛选提示）
  const failCount = q.status
    ? 0
    : await prisma.auditLog.count({
        where: { ...where, detail: { startsWith: FAIL_PREFIX } },
      }).catch(() => 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="操作审计日志"
        description="按操作人、模块、操作类型、时间范围、详情关键字、成功/失败筛选历史记录"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            筛选查询
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40 space-y-1.5">
                <Label htmlFor="operator">操作人</Label>
                <Input
                  id="operator"
                  name="operator"
                  defaultValue={q.operator}
                  placeholder="操作人姓名"
                />
              </div>
              <div className="w-36 space-y-1.5">
                <Label htmlFor="module">模块</Label>
                <Select id="module" name="module" defaultValue={q.module ?? ""}>
                  <option value="">全部模块</option>
                  <option value="基础信息">基础信息</option>
                  <option value="入库">入库</option>
                  <option value="领用归还">领用归还</option>
                  <option value="库存调整">库存调整</option>
                  <option value="用户管理">用户管理</option>
                </Select>
              </div>
              <div className="w-28 space-y-1.5">
                <Label htmlFor="action">操作</Label>
                <Select id="action" name="action" defaultValue={q.action ?? ""}>
                  <option value="">全部</option>
                  <option value="增">增</option>
                  <option value="删">删</option>
                  <option value="改">改</option>
                  <option value="查">查</option>
                </Select>
              </div>
              <div className="w-28 space-y-1.5">
                <Label htmlFor="status">状态</Label>
                <Select id="status" name="status" defaultValue={q.status ?? ""}>
                  <option value="">全部</option>
                  <option value="成功">成功</option>
                  <option value="失败">失败</option>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="keyword">详情关键字</Label>
                <Input
                  id="keyword"
                  name="keyword"
                  defaultValue={q.keyword}
                  placeholder="搜索详情内容，如化学品名称、批次号"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={q.startDate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={q.endDate}
                />
              </div>
              <Button type="submit">
                <Filter className="h-4 w-4" />
                查询
              </Button>
              <Button asChild variant="outline">
                <Link href="/audit">重置</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollText className="h-4 w-4" />
            共 {total} 条日志
            {failCount > 0 && (
              <Badge variant="danger" className="ml-2">
                含 {failCount} 条失败
              </Badge>
            )}
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              第 {page} / {totalPages} 页
            </span>
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
                <TableHead className="text-center">状态</TableHead>
                <TableHead>详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => {
                const isFail = l.detail.startsWith(FAIL_PREFIX);
                return (
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
                    <TableCell className="text-center">
                      {isFail ? (
                        <Badge variant="danger">失败</Badge>
                      ) : (
                        <Badge variant="success">成功</Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-md truncate text-muted-foreground"
                      title={l.detail}
                    >
                      {l.detail}
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    暂无符合条件的日志
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          {total > 0 && (
            <div className="flex items-center justify-between border-t p-3">
              <span className="text-xs text-muted-foreground">
                每页 {PAGE_SIZE} 条，共 {total} 条
              </span>
              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                )}
                <span className="text-sm tabular-nums">
                  {page} / {totalPages}
                </span>
                {hasNext ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(page + 1)}>
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
