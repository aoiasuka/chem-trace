// 成员B：入库管理页面
import { PackagePlus } from "lucide-react";
import { listChemicals } from "../chemicals/actions";
import { doStockIn, listStockIn } from "./actions";
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

export default async function StockInPage() {
  const chemicals = await listChemicals();
  const history = await listStockIn();

  return (
    <div className="space-y-6">
      <PageHeader
        title="入库管理"
        description="登记采购批次，入库数量自动累加到库存"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PackagePlus className="h-4 w-4" />
            新增入库记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={doStockIn}
            className="grid grid-cols-2 gap-3 md:grid-cols-3"
          >
            <div className="col-span-2 space-y-1.5 md:col-span-1">
              <Label htmlFor="chemicalId">危化品</Label>
              <Select id="chemicalId" name="chemicalId" required>
                <option value="">选择危化品</option>
                {chemicals.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}（当前 {c.currentQuantity}
                    {c.unit}）
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batchNo">采购批次号</Label>
              <Input id="batchNo" name="batchNo" placeholder="采购批次号" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier">供应商</Label>
              <Input id="supplier" name="supplier" placeholder="供应商" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inQuantity">入库数量</Label>
              <Input
                id="inQuantity"
                name="inQuantity"
                type="number"
                step="0.01"
                placeholder="入库数量"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="operator">操作人</Label>
              <Input id="operator" name="operator" placeholder="操作人" required />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                确认入库
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">入库历史</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>时间</TableHead>
                <TableHead>危化品</TableHead>
                <TableHead>批次</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead className="text-center">数量</TableHead>
                <TableHead>操作人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {h.inDate.toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {h.chemical.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.batchNo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.supplier}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success" className="tabular-nums">
                      +{h.inQuantity} {h.chemical.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.operator}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    暂无入库记录
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
