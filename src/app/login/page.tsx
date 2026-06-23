"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <form
        action={formAction}
        className="w-80 rounded-lg bg-white p-8 shadow-md space-y-4"
      >
        <h1 className="text-center text-xl font-bold">危化品追溯系统登录</h1>
        <div>
          <label className="block text-sm mb-1">用户名</label>
          <input
            name="username"
            defaultValue="admin"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">密码</label>
          <input
            name="password"
            type="password"
            defaultValue="123456"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-slate-800 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "登录中..." : "登 录"}
        </button>
        <p className="text-center text-xs text-gray-400">默认账号 admin / 123456</p>
      </form>
    </div>
  );
}
