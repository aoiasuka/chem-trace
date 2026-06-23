// 审计包装（成员E）—— 全队"写"类 Server Action 一包即自动记审计日志
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AuditAction = "增" | "删" | "改" | "查";

/**
 * 包装任意 Server Action：执行后自动写审计日志（操作人、时间、模块、详情）。
 * 用法：export const createX = withAudit("增", "入库", async (form) => {...})
 */
export function withAudit<A extends unknown[], R>(
  action: AuditAction,
  module: string,
  fn: (...args: A) => Promise<R>,
) {
  return async (...args: A): Promise<R> => {
    const session = await auth();
    const operator = session?.user?.name ?? "匿名";
    try {
      const result = await fn(...args);
      await prisma.auditLog.create({
        data: { action, module, operator, detail: summarize(args) },
      });
      return result;
    } catch (e) {
      // 失败也留痕，便于追溯
      await prisma.auditLog.create({
        data: {
          action,
          module,
          operator,
          detail: `[失败] ${(e as Error).message}`,
        },
      });
      throw e;
    }
  };
}

function summarize(args: unknown[]): string {
  const s = args
    .map((a) =>
      a instanceof FormData
        ? JSON.stringify(Object.fromEntries(a))
        : JSON.stringify(a),
    )
    .join(", ");
  return s.length > 500 ? s.slice(0, 500) : s;
}
