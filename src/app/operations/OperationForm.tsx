"use client";
// 成员C：领用归还表单（含库存不足错误提示 + 角色限制操作类型）
import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";
import type { Role } from "@/lib/permissions";

type Chemical = { id: number; name: string; currentQuantity: number; unit: string };

// 各角色可选操作类型
const OP_OPTIONS: Record<Role, { value: string; label: string }[]> = {
  ADMIN: [
    { value: "领用", label: "领用" },
    { value: "归还", label: "归还" },
    { value: "废弃", label: "废弃（审批处置）" },
  ],
  WAREHOUSE: [
    { value: "领用", label: "领用" },
    { value: "归还", label: "归还" },
  ],
  RESEARCHER: [
    { value: "领用", label: "领用" },
    { value: "归还", label: "归还" },
  ],
  SAFETY: [
    { value: "领用", label: "领用" },
    { value: "归还", label: "归还" },
    { value: "废弃", label: "废弃（审批处置）" },
  ],
};

export default function OperationForm({
  chemicals,
  action,
  role,
  defaultOperator,
}: {
  chemicals: Chemical[];
  action: (form: FormData) => Promise<void>;
  role: Role;
  defaultOperator?: string;
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | undefined, form: FormData) => {
      try {
        await action(form);
        return undefined;
      } catch (e) {
        return (e as Error).message;
      }
    },
    undefined,
  );

  const options = OP_OPTIONS[role] ?? OP_OPTIONS.RESEARCHER;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ArrowRightLeft className="h-4 w-4" />
          登记领用 / 归还 / 废弃
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            <Label htmlFor="opType">类型</Label>
            <Select id="opType" name="opType" defaultValue={options[0]?.value}>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="operator">领用人 / 操作人</Label>
            <Input
              id="operator"
              name="operator"
              defaultValue={defaultOperator}
              placeholder="领用人 / 操作人"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">数量</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              placeholder="数量"
              required
            />
          </div>
          <div className="col-span-2 md:col-span-4 md:flex md:justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {pending ? "提交中…" : "提交"}
            </Button>
          </div>
          {error && (
            <p className="col-span-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-4">
              ⚠ {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
