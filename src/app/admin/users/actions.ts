"use server";
// 用户管理（仅管理员）—— 账号增删改、改角色、重置密码
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-guard";
import { OP_ROLES, type Role, ALL_ROLES } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const validRoles = ALL_ROLES as unknown as [Role, ...Role[]];

const CreateUserSchema = z.object({
  username: z.string().min(2, "用户名至少 2 位"),
  realName: z.string().min(1, "真实姓名必填"),
  password: z.string().min(4, "密码至少 4 位"),
  role: z.enum(validRoles),
});

const UpdateRoleSchema = z.object({
  id: z.coerce.number(),
  role: z.enum(validRoles),
});

const ResetPasswordSchema = z.object({
  id: z.coerce.number(),
  password: z.string().min(4, "密码至少 4 位"),
});

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, realName: true, role: true },
  });
}

// 新增用户
export const createUser = withAudit("增", "用户管理", async (form: FormData) => {
  await requireRole(...OP_ROLES.userManage);
  const data = CreateUserSchema.parse(Object.fromEntries(form));
  const exist = await prisma.user.findUnique({ where: { username: data.username } });
  if (exist) throw new Error("用户名已存在");
  const password = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: { username: data.username, realName: data.realName, password, role: data.role },
  });
  revalidatePath("/admin/users");
});

// 修改角色
export const updateUserRole = withAudit("改", "用户管理", async (form: FormData) => {
  await requireRole(...OP_ROLES.userManage);
  const { id, role } = UpdateRoleSchema.parse(Object.fromEntries(form));
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
});

// 重置密码
export const resetPassword = withAudit("改", "用户管理", async (form: FormData) => {
  await requireRole(...OP_ROLES.userManage);
  const { id, password } = ResetPasswordSchema.parse(Object.fromEntries(form));
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { password: hash } });
  revalidatePath("/admin/users");
});

// 删除用户（禁止删除自己，避免锁死）
export const deleteUser = withAudit("删", "用户管理", async (form: FormData) => {
  await requireRole(...OP_ROLES.userManage);
  const id = Number(form.get("id"));
  const selfId = Number(form.get("selfId") ?? 0);
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("用户不存在");
  if (target.username === "admin") throw new Error("内置管理员账号不可删除");
  if (selfId && selfId === id) throw new Error("不能删除当前登录账号");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
});
