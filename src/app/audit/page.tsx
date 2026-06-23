// 成员E：操作审计日志页面
import { prisma } from "@/lib/prisma";

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
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">操作审计日志</h1>

      <form method="get" className="flex flex-wrap gap-2">
        <input name="operator" defaultValue={q.operator} placeholder="操作人" className="rounded border px-3 py-1.5" />
        <select name="module" defaultValue={q.module ?? ""} className="rounded border px-3 py-1.5">
          <option value="">全部模块</option>
          <option value="基础信息">基础信息</option>
          <option value="入库">入库</option>
          <option value="领用归还">领用归还</option>
        </select>
        <select name="action" defaultValue={q.action ?? ""} className="rounded border px-3 py-1.5">
          <option value="">全部操作</option>
          <option value="增">增</option>
          <option value="删">删</option>
          <option value="改">改</option>
          <option value="查">查</option>
        </select>
        <button className="rounded bg-slate-700 px-4 py-1.5 text-white">筛选</button>
      </form>

      <table className="w-full border bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">时间</th><th className="p-2">操作人</th>
            <th className="p-2">模块</th><th className="p-2">操作</th><th className="p-2 text-left">详情</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="p-2 text-center whitespace-nowrap">{l.opTime.toLocaleString("zh-CN")}</td>
              <td className="p-2 text-center">{l.operator}</td>
              <td className="p-2 text-center">{l.module}</td>
              <td className="p-2 text-center">{l.action}</td>
              <td className="p-2 max-w-md truncate" title={l.detail}>{l.detail}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="p-4 text-center text-gray-400">暂无日志</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
