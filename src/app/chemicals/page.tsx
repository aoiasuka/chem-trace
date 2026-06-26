// 成员A：基础信息库页面
import { Search, Plus } from "lucide-react";
import { listChemicals, createChemical, deleteChemical } from "./actions";
import MsdsButton from "./MsdsButton";
import { DeleteButton } from "./DeleteButton";
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
import { cn } from "@/lib/utils";

function CategoryBadge({ category }: { category: string }) {
  if (category === "易制爆") return <Badge variant="warning">{category}</Badge>;
  if (category === "易制毒")
    return (
      <Badge
        variant="outline"
        className="border-violet-200 bg-violet-50 text-violet-700"
      >
        {category}
      </Badge>
    );
  return <Badge variant="secondary">{category}</Badge>;
}

export default async function ChemicalsPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; category?: string }>;
}) {
  const { keyword, category } = await searchParams;
  const list = await listChemicals(keyword, category);

  return (
    <div className="space-y-6">
      <PageHeader
        title="危化品基础信息库"
        description="维护危化品名称、CAS 号、危险特性与安全阈值"
      />

      {/* 检索栏 */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="keyword">名称 / CAS 号</Label>
              <Input
                id="keyword"
                name="keyword"
                defaultValue={keyword}
                placeholder="例如：浓盐酸、7647-01-0"
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="category">类别</Label>
              <Select name="category" defaultValue={category ?? ""}>
                <option value="">全部类别</option>
                <option value="易制毒">易制毒</option>
                <option value="易制爆">易制爆</option>
                <option value="其他">其他</option>
              </Select>
            </div>
            <Button type="submit">
              <Search className="h-4 w-4" />
              查询
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 新增表单 */}
      <Card>
        <details>
          <summary className="flex cursor-pointer list-none items-center gap-2 p-6 text-sm font-medium hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
            <Plus className="h-4 w-4" />
            新增危化品
          </summary>
          <CardContent>
            <form
              action={createChemical}
              className="grid grid-cols-2 gap-3 md:grid-cols-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="n-name">名称</Label>
                <Input id="n-name" name="name" placeholder="名称" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n-cas">CAS 号</Label>
                <Input id="n-cas" name="casNo" placeholder="CAS 号" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n-cat">类别</Label>
                <Select id="n-cat" name="category">
                  <option value="易制毒">易制毒</option>
                  <option value="易制爆">易制爆</option>
                  <option value="其他">其他</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n-haz">危险特性</Label>
                <Input id="n-haz" name="hazardDesc" placeholder="危险特性" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n-msds">MSDS 链接</Label>
                <Input id="n-msds" name="msdsUrl" placeholder="MSDS 链接" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n-unit">单位</Label>
                <Input id="n-unit" name="unit" placeholder="g / mL" defaultValue="g" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n-thr">安全阈值</Label>
                <Input
                  id="n-thr"
                  name="safeThreshold"
                  type="number"
                  step="0.01"
                  placeholder="安全阈值"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  保存
                </Button>
              </div>
            </form>
          </CardContent>
        </details>
      </Card>

      {/* 列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            共 {list.length} 条记录
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>名称</TableHead>
                <TableHead className="text-center">CAS 号</TableHead>
                <TableHead className="text-center">类别</TableHead>
                <TableHead className="text-center">当前库存</TableHead>
                <TableHead className="text-center">安全阈值</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => {
                const low = c.currentQuantity < c.safeThreshold;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {c.casNo || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <CategoryBadge category={c.category} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          low && "text-destructive",
                        )}
                      >
                        {c.currentQuantity} {c.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {c.safeThreshold} {c.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <MsdsButton chemical={c} />
                        <DeleteButton action={deleteChemical} id={c.id} name={c.name} />
                      </div>
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
