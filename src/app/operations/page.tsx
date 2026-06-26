// 成员C：领用归还页面
import { listChemicals } from "../chemicals/actions";
import { doOperation, listOperations } from "./actions";
import OperationForm from "./OperationForm";
import { PageHeader } from "@/components/page-header";
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

function OpBadge({ type }: { type: string }) {
  if (type === "归还") return <Badge variant="success">{type}</Badge>;
  if (type === "废弃") return <Badge variant="secondary">{type}</Badge>;
  return <Badge variant="info">{type}</Badge>;
}

export default async function OperationsPage() {
  const chemicals = await listChemicals();
  const logs = await listOperations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="领用与归还"
        description="登记领用、归还、废弃流水，自动扣减或回补库存"
      />

      <OperationForm chemicals={chemicals} action={doOperation} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">操作流水</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>时间</TableHead>
                <TableHead>危化品</TableHead>
                <TableHead className="text-center">类型</TableHead>
                <TableHead className="text-center">数量</TableHead>
                <TableHead>领用人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {l.opTime.toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell className="font-medium">{l.chemical.name}</TableCell>
                  <TableCell className="text-center">
                    <OpBadge type={l.opType} />
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {l.quantity} {l.chemical.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.operator}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    暂无流水
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
