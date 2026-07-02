"use server";
// 成员A：危化品基础信息库与 MSDS
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-guard";
import { OP_ROLES } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ChemicalSchema = z.object({
  name: z.string().min(1, "名称必填"),
  casNo: z.string().optional(),
  category: z.enum(["易制毒", "易制爆", "其他"]),
  hazardDesc: z.string().optional(),
  msdsUrl: z.string().optional(),
  safeThreshold: z.coerce.number().min(0),
  unit: z.string().min(1),
});

// 查询（名称/CAS/类别检索）—— 所有已登录角色可查
export async function listChemicals(keyword?: string, category?: string) {
  return prisma.chemical.findMany({
    where: {
      AND: [
        keyword
          ? { OR: [{ name: { contains: keyword } }, { casNo: { contains: keyword } }] }
          : {},
        category ? { category } : {},
      ],
    },
    orderBy: { id: "desc" },
  });
}

// 新增（管理员：基础数据维护）
export const createChemical = withAudit("增", "基础信息", async (form: FormData) => {
  await requireRole(...OP_ROLES.chemicalManage);
  const data = ChemicalSchema.parse(Object.fromEntries(form));
  await prisma.chemical.create({ data });
  revalidatePath("/chemicals");
});

// 修改（管理员：基础数据维护）
export const updateChemical = withAudit("改", "基础信息", async (form: FormData) => {
  await requireRole(...OP_ROLES.chemicalManage);
  const id = Number(form.get("id"));
  const data = ChemicalSchema.parse(Object.fromEntries(form));
  await prisma.chemical.update({ where: { id }, data });
  revalidatePath("/chemicals");
});

// 删除（管理员：基础数据维护；先清理关联的入库/操作记录，再删化学品）
export const deleteChemical = withAudit("删", "基础信息", async (form: FormData) => {
  await requireRole(...OP_ROLES.chemicalManage);
  const id = Number(form.get("id"));
  await prisma.$transaction([
    prisma.stockIn.deleteMany({ where: { chemicalId: id } }),
    prisma.opLog.deleteMany({ where: { chemicalId: id } }),
    prisma.chemical.delete({ where: { id } }),
  ]);
  revalidatePath("/chemicals");
  revalidatePath("/stock-in");
  revalidatePath("/operations");
  revalidatePath("/warning");
});

// 库存盘点调整（管理员 / 仓库管理员）—— 盘点后直接修正当前库存
export const adjustStock = withAudit("改", "库存调整", async (form: FormData) => {
  await requireRole(...OP_ROLES.stockAdjust);
  const id = Number(form.get("id"));
  const currentQuantity = z.coerce
    .number()
    .min(0, "库存不能为负")
    .parse(form.get("currentQuantity"));
  const remark = String(form.get("remark") ?? "").slice(0, 100);
  await prisma.chemical.update({
    where: { id },
    data: { currentQuantity },
  });
  void remark; // 备注仅记入审计详情
  revalidatePath("/chemicals");
  revalidatePath("/warning");
  revalidatePath("/stock-in");
});
