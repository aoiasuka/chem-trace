// 服务端权限守卫（Node 运行时，依赖 Prisma/auth）
// 供所有业务 Server Action 调用做操作级 RBAC
import { auth } from "@/lib/auth";
import {
  type Role,
  ROLE_LABELS,
} from "@/lib/permissions";

export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return (role as Role) ?? null;
}

export async function getCurrentUser(): Promise<{
  id: string;
  name?: string | null;
  role: Role;
} | null> {
  const session = await auth();
  if (!session?.user) return null;
  const role = ((session.user as { role?: string }).role as Role) ?? null;
  if (!role) return null;
  return { id: session.user.id!, name: session.user.name, role };
}

/**
 * 校验当前用户角色是否在允许列表内，不通过则抛错。
 * 用法：await requireRole(...OP_ROLES.dispose)
 */
export async function requireRole(...allowed: Role[]): Promise<Role> {
  const role = await getCurrentRole();
  if (!role || !allowed.includes(role)) {
    const allowedLabels = allowed.map((r) => ROLE_LABELS[r]).join("、");
    throw new Error(`权限不足，该操作仅限「${allowedLabels}」执行`);
  }
  return role;
}
