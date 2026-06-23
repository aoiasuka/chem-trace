// 成员D：库存预警页面（低于安全阈值标红）
import { prisma } from "@/lib/prisma";

export default async function WarningPage() {
  const all = await prisma.chemical.findMany({ orderBy: { id: "asc" } });
  const list = all.map((c) => ({ ...c, warning: c.currentQuantity < c.safeThreshold }));
  const warnCount = list.filter((c) => c.warning).length;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">库存预警</h1>

      {warnCount > 0 ? (
        <div className="rounded bg-red-100 px-4 py-2 text-red-700">
          ⚠️ 当前有 {warnCount} 种危化品库存低于安全阈值，请及时补充！
        </div>
      ) : (
        <div className="rounded bg-emerald-100 px-4 py-2 text-emerald-700">
          ✅ 所有危化品库存均在安全阈值以上。
        </div>
      )}

      <table className="w-full border bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">名称</th><th className="p-2">类别</th>
            <th className="p-2">当前库存</th><th className="p-2">安全阈值</th><th className="p-2">状态</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr
              key={c.id}
              className={c.warning ? "border-t bg-red-100 font-semibold text-red-700" : "border-t"}
            >
              <td className="p-2">{c.name}</td>
              <td className="p-2 text-center">{c.category}</td>
              <td className="p-2 text-center">{c.currentQuantity} {c.unit}</td>
              <td className="p-2 text-center">{c.safeThreshold} {c.unit}</td>
              <td className="p-2 text-center">
                {c.warning ? (
                  <span className="rounded bg-red-500 px-2 py-0.5 text-white">⚠️ 低于阈值</span>
                ) : (
                  <span className="rounded bg-emerald-500 px-2 py-0.5 text-white">正常</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
