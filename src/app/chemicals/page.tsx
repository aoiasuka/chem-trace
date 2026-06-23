// 成员A：基础信息库页面
import { listChemicals, createChemical, deleteChemical } from "./actions";
import MsdsButton from "./MsdsButton";

export default async function ChemicalsPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; category?: string }>;
}) {
  const { keyword, category } = await searchParams;
  const list = await listChemicals(keyword, category);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">危化品基础信息库</h1>

      {/* 检索栏 */}
      <form method="get" className="flex gap-2 items-end">
        <input
          name="keyword"
          defaultValue={keyword}
          placeholder="名称 / CAS 号"
          className="rounded border px-3 py-1.5"
        />
        <select name="category" defaultValue={category ?? ""} className="rounded border px-3 py-1.5">
          <option value="">全部类别</option>
          <option value="易制毒">易制毒</option>
          <option value="易制爆">易制爆</option>
          <option value="其他">其他</option>
        </select>
        <button className="rounded bg-slate-700 px-4 py-1.5 text-white">查询</button>
      </form>

      {/* 新增表单 */}
      <details className="rounded border bg-white p-4">
        <summary className="cursor-pointer font-medium">➕ 新增危化品</summary>
        <form action={createChemical} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <input name="name" placeholder="名称" className="rounded border px-3 py-1.5" required />
          <input name="casNo" placeholder="CAS 号" className="rounded border px-3 py-1.5" />
          <select name="category" className="rounded border px-3 py-1.5">
            <option value="易制毒">易制毒</option>
            <option value="易制爆">易制爆</option>
            <option value="其他">其他</option>
          </select>
          <input name="hazardDesc" placeholder="危险特性" className="rounded border px-3 py-1.5" />
          <input name="msdsUrl" placeholder="MSDS 链接" className="rounded border px-3 py-1.5" />
          <input name="unit" placeholder="单位(g/mL)" defaultValue="g" className="rounded border px-3 py-1.5" />
          <input name="safeThreshold" type="number" step="0.01" placeholder="安全阈值" className="rounded border px-3 py-1.5" required />
          <button className="rounded bg-emerald-600 px-4 py-1.5 text-white">保存</button>
        </form>
      </details>

      {/* 列表 */}
      <table className="w-full border bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">名称</th>
            <th className="p-2">CAS号</th>
            <th className="p-2">类别</th>
            <th className="p-2">当前库存</th>
            <th className="p-2">安全阈值</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.name}</td>
              <td className="p-2 text-center">{c.casNo}</td>
              <td className="p-2 text-center">
                <span
                  className={
                    c.category === "易制爆"
                      ? "rounded bg-orange-100 px-2 text-orange-700"
                      : c.category === "易制毒"
                        ? "rounded bg-purple-100 px-2 text-purple-700"
                        : "rounded bg-gray-100 px-2"
                  }
                >
                  {c.category}
                </span>
              </td>
              <td className="p-2 text-center">{c.currentQuantity} {c.unit}</td>
              <td className="p-2 text-center">{c.safeThreshold} {c.unit}</td>
              <td className="p-2 text-center space-x-2 whitespace-nowrap">
                <MsdsButton chemical={c} />
                <form action={deleteChemical} className="inline">
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-red-600 hover:underline">删除</button>
                </form>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-400">暂无数据</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
