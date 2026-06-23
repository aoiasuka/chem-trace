"use client";
// 成员A：MSDS 安全数据表查看弹窗
import { useState } from "react";

type Chemical = {
  name: string;
  casNo: string | null;
  category: string;
  hazardDesc: string | null;
  msdsUrl: string | null;
};

export default function MsdsButton({ chemical }: { chemical: Chemical }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-blue-600 hover:underline">
        MSDS
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-96 rounded-lg bg-white p-6 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-bold">MSDS 安全数据表</h3>
            <p><b>名称：</b>{chemical.name}</p>
            <p><b>CAS 号：</b>{chemical.casNo || "—"}</p>
            <p><b>类别：</b>{chemical.category}</p>
            <p><b>危险特性：</b>{chemical.hazardDesc || "—"}</p>
            <p className="mt-2">
              {chemical.msdsUrl ? (
                <a href={chemical.msdsUrl} target="_blank" className="text-blue-600 underline">
                  查看完整 MSDS 文档 →
                </a>
              ) : (
                <span className="text-gray-400">暂无 MSDS 文档链接</span>
              )}
            </p>
            <div className="mt-4 text-right">
              <button onClick={() => setOpen(false)} className="rounded bg-slate-700 px-4 py-1.5 text-white">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
