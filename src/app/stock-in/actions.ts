"use server";
// 成员B：入库管理
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-guard";
import { OP_ROLES } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const StockInSchema = z.object({
  chemicalId: z.coerce.number(),
  batchNo: z.string().min(1),
  supplier: z.string().min(1),
  inQuantity: z.coerce.number().positive(),
  operator: z.string().min(1),
});

// 入库 + 自动累加库存总量（事务保证一致）
export const doStockIn = withAudit("增", "入库", async (form: FormData) => {
  await requireRole(...OP_ROLES.stockIn);
  const data = StockInSchema.parse(Object.fromEntries(form));
  await prisma.$transaction([
    prisma.stockIn.create({ data }),
    prisma.chemical.update({
      where: { id: data.chemicalId },
      data: { currentQuantity: { increment: data.inQuantity } },
    }),
  ]);
  revalidatePath("/stock-in");
  revalidatePath("/warning");
  revalidatePath("/chemicals");
});

export async function listStockIn() {
  return prisma.stockIn.findMany({
    include: { chemical: true },
    orderBy: { inDate: "desc" },
    take: 100,
  });
}
