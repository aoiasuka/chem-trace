// 成员B：入库管理页面
import { listChemicals } from "../chemicals/actions";
import { doStockIn, listStockIn } from "./actions";

export default async function StockInPage() {
  const chemicals = await listChemicals();
  const history = await listStockIn();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">入库管理</h1>

      <form action={doStockIn} className="grid grid-cols-2 gap-3 rounded border bg-white p-4 md:grid-cols-3">
        <select name="chemicalId" className="rounded border px-3 py-1.5" required>
          <option value="">选择危化品</option>
          {chemicals.map((c) => (
            <option key={c.id} value={c.id}>{c.name}（当前 {c.currentQuantity}{c.unit}）</option>
          ))}
        </select>
        <input name="batchNo" placeholder="采购批次号" className="rounded border px-3 py-1.5" required />
        <input name="supplier" placeholder="供应商" className="rounded border px-3 py-1.5" required />
        <input name="inQuantity" type="number" step="0.01" placeholder="入库数量" className="rounded border px-3 py-1.5" required />
        <input name="operator" placeholder="操作人" className="rounded border px-3 py-1.5" required />
        <button className="rounded bg-emerald-600 px-4 py-1.5 text-white">确认入库</button>
      </form>

      <h2 className="font-medium">入库历史</h2>
      <table className="w-full border bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">时间</th><th className="p-2">危化品</th><th className="p-2">批次</th>
            <th className="p-2">供应商</th><th className="p-2">数量</th><th className="p-2">操作人</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className="border-t text-center">
              <td className="p-2">{h.inDate.toLocaleString("zh-CN")}</td>
              <td className="p-2">{h.chemical.name}</td>
              <td className="p-2">{h.batchNo}</td>
              <td className="p-2">{h.supplier}</td>
              <td className="p-2">+{h.inQuantity} {h.chemical.unit}</td>
              <td className="p-2">{h.operator}</td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr><td colSpan={6} className="p-4 text-center text-gray-400">暂无入库记录</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
