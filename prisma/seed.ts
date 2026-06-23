// 初始化种子数据：管理员账号 + 示例危化品
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 管理员账号：admin / 123456
  const password = await bcrypt.hash("123456", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password, realName: "系统管理员", role: "ADMIN" },
  });

  // 示例危化品（易制毒 / 易制爆 各若干）
  const chemicals = [
    { name: "浓盐酸", casNo: "7647-01-0", category: "易制毒", hazardDesc: "强腐蚀性，挥发刺激性气体", msdsUrl: "https://example.com/msds/hcl.pdf", safeThreshold: 500, unit: "mL", currentQuantity: 2000 },
    { name: "高锰酸钾", casNo: "7722-64-7", category: "易制爆", hazardDesc: "强氧化剂，遇可燃物易燃", msdsUrl: "https://example.com/msds/kmno4.pdf", safeThreshold: 200, unit: "g", currentQuantity: 150 },
    { name: "丙酮", casNo: "67-64-1", category: "易制毒", hazardDesc: "极易燃，麻醉性", msdsUrl: "https://example.com/msds/acetone.pdf", safeThreshold: 1000, unit: "mL", currentQuantity: 3000 },
    { name: "硝酸钾", casNo: "7757-79-1", category: "易制爆", hazardDesc: "氧化剂，助燃", msdsUrl: "https://example.com/msds/kno3.pdf", safeThreshold: 300, unit: "g", currentQuantity: 280 },
    { name: "硫酸", casNo: "7664-93-9", category: "其他", hazardDesc: "强腐蚀性，强吸水性", msdsUrl: "https://example.com/msds/h2so4.pdf", safeThreshold: 500, unit: "mL", currentQuantity: 1200 },
  ];

  for (const c of chemicals) {
    const exist = await prisma.chemical.findFirst({ where: { name: c.name } });
    if (!exist) await prisma.chemical.create({ data: c });
  }

  console.log("✅ 种子数据初始化完成：admin/123456，示例危化品 5 条");
}

main().finally(() => prisma.$disconnect());
