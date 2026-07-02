"use server";
// 成员C：领用与归还
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole, getCurrentUser } from "@/lib/auth-guard";
import { OP_ROLES } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const OpSchema = z.object({
  chemicalId: z.coerce.number(),
  opType: z.enum(["领用", "归还", "废弃"]),
  operator: z.string().min(1),
  quantity: z.coerce.number().positive(),
});

// 领用/归还/废弃 + 自动计算当前库存（事务内校验，防并发超扣）
// 废弃视为"废弃审批"，仅管理员/安全负责人可执行
export const doOperation = withAudit("改", "领用归还", async (form: FormData) => {
  const { chemicalId, opType, operator, quantity } = OpSchema.parse(
    Object.fromEntries(form),
  );

  // 按操作类型校验角色权限
  if (opType === "废弃") {
    await requireRole(...OP_ROLES.dispose);
  } else {
    await requireRole(...OP_ROLES.borrowReturn);
  }

  // 操作人优先用登录用户真名，避免手工填写伪造
  const me = await getCurrentUser();
  const realOperator = me?.name ?? operator;

  await prisma.$transaction(async (tx) => {
    const chem = await tx.chemical.findUniqueOrThrow({ where: { id: chemicalId } });
    if ((opType === "领用" || opType === "废弃") && chem.currentQuantity < quantity) {
      throw new Error(`库存不足，当前仅 ${chem.currentQuantity}${chem.unit}`);
    }
    const delta = opType === "归还" ? quantity : -quantity;
    await tx.chemical.update({
      where: { id: chemicalId },
      data: { currentQuantity: { increment: delta } },
    });
    await tx.opLog.create({
      data: { chemicalId, opType, operator: realOperator, quantity },
    });
  });
  revalidatePath("/operations");
  revalidatePath("/warning");
  revalidatePath("/chemicals");
});

export async function listOperations() {
  return prisma.opLog.findMany({
    include: { chemical: true },
    orderBy: { opTime: "desc" },
    take: 100,
  });
}
