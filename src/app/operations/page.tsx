// 成员C：领用归还页面
import { listChemicals } from "../chemicals/actions";
import { doOperation, listOperations } from "./actions";
import OperationForm from "./OperationForm";

export default async function OperationsPage() {
  const chemicals = await listChemicals();
  const logs = await listOperations();

  const badge = (t: string) =>
    t === "归还"
      ? "bg-emerald-100 text-emerald-700"
      : t === "废弃"
        ? "bg-gray-200 text-gray-700"
        : "bg-indigo-100 text-indigo-700";

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">领用与归还</h1>

      <OperationForm chemicals={chemicals} action={doOperation} />

      <h2 className="font-medium">操作流水</h2>
      <table className="w-full border bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">时间</th><th className="p-2">危化品</th>
            <th className="p-2">类型</th><th className="p-2">数量</th><th className="p-2">领用人</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t text-center">
              <td className="p-2">{l.opTime.toLocaleString("zh-CN")}</td>
              <td className="p-2">{l.chemical.name}</td>
              <td className="p-2">
                <span className={`rounded px-2 py-0.5 ${badge(l.opType)}`}>{l.opType}</span>
              </td>
              <td className="p-2">{l.quantity} {l.chemical.unit}</td>
              <td className="p-2">{l.operator}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="p-4 text-center text-gray-400">暂无流水</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
