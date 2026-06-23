"use client";
// 成员C：领用归还表单（含库存不足错误提示）
import { useActionState } from "react";

type Chemical = { id: number; name: string; currentQuantity: number; unit: string };

export default function OperationForm({
  chemicals,
  action,
}: {
  chemicals: Chemical[];
  action: (form: FormData) => Promise<void>;
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

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 rounded border bg-white p-4 md:grid-cols-4">
      <select name="chemicalId" className="rounded border px-3 py-1.5" required>
        <option value="">选择危化品</option>
        {chemicals.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}（当前 {c.currentQuantity}{c.unit}）
          </option>
        ))}
      </select>
      <select name="opType" className="rounded border px-3 py-1.5">
        <option value="领用">领用</option>
        <option value="归还">归还</option>
        <option value="废弃">废弃</option>
      </select>
      <input name="operator" placeholder="领用人/操作人" className="rounded border px-3 py-1.5" required />
      <input name="quantity" type="number" step="0.01" placeholder="数量" className="rounded border px-3 py-1.5" required />
      <button disabled={pending} className="col-span-2 rounded bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-50 md:col-span-1">
        {pending ? "提交中..." : "提交"}
      </button>
      {error && <p className="col-span-2 text-sm text-red-600 md:col-span-4">⚠️ {error}</p>}
    </form>
  );
}
