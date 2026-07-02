// 初始化种子数据：4 角色账号 + 示例危化品(覆盖4档分级) + 入库/操作/审计案例
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 86400000;
function daysAgo(n: number, hour = 10, min = 0) {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, min, 0, 0);
  return d;
}

async function main() {
  // —— 1. 用户（4 角色，统一密码 123456）——
  const password = await bcrypt.hash("123456", 10);
  const users = [
    { username: "admin", realName: "系统管理员", role: "ADMIN" },
    { username: "warehouse", realName: "王仓管", role: "WAREHOUSE" },
    { username: "researcher", realName: "李实验", role: "RESEARCHER" },
    { username: "safety", realName: "张安全", role: "SAFETY" },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { realName: u.realName, role: u.role },
      create: { ...u, password },
    });
  }

  // —— 2. 危化品（覆盖预警 4 档分级）——
  // 充足≥100% / 偏低80-100% / 低于阈值50-80% / 严重不足<50%
  const chemicals = [
    { name: "浓盐酸", casNo: "7647-01-0", category: "易制毒", hazardDesc: "强腐蚀性，挥发刺激性气体", msdsUrl: "https://example.com/msds/hcl.pdf", safeThreshold: 500, unit: "mL", currentQuantity: 2000 },
    { name: "高锰酸钾", casNo: "7722-64-7", category: "易制爆", hazardDesc: "强氧化剂，遇可燃物易燃", msdsUrl: "https://example.com/msds/kmno4.pdf", safeThreshold: 200, unit: "g", currentQuantity: 90 }, // 严重不足 45%
    { name: "丙酮", casNo: "67-64-1", category: "易制毒", hazardDesc: "极易燃，麻醉性", msdsUrl: "https://example.com/msds/acetone.pdf", safeThreshold: 1000, unit: "mL", currentQuantity: 3000 },
    { name: "硝酸钾", casNo: "7757-79-1", category: "易制爆", hazardDesc: "氧化剂，助燃", msdsUrl: "https://example.com/msds/kno3.pdf", safeThreshold: 300, unit: "g", currentQuantity: 260 }, // 偏低 87%
    { name: "硫酸", casNo: "7664-93-9", category: "其他", hazardDesc: "强腐蚀性，强吸水性", msdsUrl: "https://example.com/msds/h2so4.pdf", safeThreshold: 500, unit: "mL", currentQuantity: 1200 },
    { name: "无水乙醇", casNo: "64-17-5", category: "易制毒", hazardDesc: "易燃，麻醉性", msdsUrl: "https://example.com/msds/ethanol.pdf", safeThreshold: 200, unit: "mL", currentQuantity: 120 }, // 低于阈值 60%
  ];
  const chemMap = new Map<string, number>();
  for (const c of chemicals) {
    const exist = await prisma.chemical.findFirst({ where: { name: c.name } });
    const rec = exist
      ? await prisma.chemical.update({ where: { id: exist.id }, data: c })
      : await prisma.chemical.create({ data: c });
    chemMap.set(c.name, rec.id);
  }

  // —— 3. 清空旧案例流水/审计，重新插入演示数据 ——
  await prisma.opLog.deleteMany({});
  await prisma.stockIn.deleteMany({});
  await prisma.auditLog.deleteMany({});

  const hcl = chemMap.get("浓盐酸")!;
  const kmno4 = chemMap.get("高锰酸钾")!;
  const acetone = chemMap.get("丙酮")!;
  const kno3 = chemMap.get("硝酸钾")!;
  const ethanol = chemMap.get("无水乙醇")!;

  // 入库案例
  await prisma.stockIn.createMany({
    data: [
      { chemicalId: hcl, batchNo: "HCL-2024-001", supplier: "国药集团", inQuantity: 2000, operator: "王仓管", inDate: daysAgo(30, 9) },
      { chemicalId: kmno4, batchNo: "KM-2024-003", supplier: "西陇科学", inQuantity: 500, operator: "王仓管", inDate: daysAgo(20, 14) },
      { chemicalId: acetone, batchNo: "ACE-2024-002", supplier: "国药集团", inQuantity: 3000, operator: "王仓管", inDate: daysAgo(15, 11) },
      { chemicalId: ethanol, batchNo: "ET-2025-001", supplier: "阿拉丁", inQuantity: 300, operator: "王仓管", inDate: daysAgo(3, 9, 30) },
      { chemicalId: kno3, batchNo: "KN-2025-005", supplier: "麦克林", inQuantity: 260, operator: "王仓管", inDate: daysAgo(0, 8, 45) }, // 今日入库
    ],
  });

  // 领用/归还/废弃案例
  await prisma.opLog.createMany({
    data: [
      { chemicalId: hcl, opType: "领用", operator: "李实验", quantity: 200, opTime: daysAgo(25, 10) },
      { chemicalId: acetone, opType: "领用", operator: "李实验", quantity: 500, opTime: daysAgo(12, 15) },
      { chemicalId: acetone, opType: "归还", operator: "李实验", quantity: 200, opTime: daysAgo(5, 16) },
      { chemicalId: kmno4, opType: "废弃", operator: "张安全", quantity: 50, opTime: daysAgo(8, 14) },
      { chemicalId: ethanol, opType: "领用", operator: "李实验", quantity: 180, opTime: daysAgo(1, 13) },
      { chemicalId: hcl, opType: "领用", operator: "李实验", quantity: 100, opTime: daysAgo(0, 9, 20) }, // 今日领用
    ],
  });

  // 审计日志案例（各模块各操作，含失败案例，便于筛选演示）
  await prisma.auditLog.createMany({
    data: [
      { action: "增", module: "入库", operator: "王仓管", detail: '{"chemicalId":6,"batchNo":"ET-2025-001","supplier":"阿拉丁","inQuantity":300}', opTime: daysAgo(3, 9, 30) },
      { action: "增", module: "入库", operator: "王仓管", detail: '{"chemicalId":4,"batchNo":"KN-2025-005","supplier":"麦克林","inQuantity":260}', opTime: daysAgo(0, 8, 45) },
      { action: "改", module: "领用归还", operator: "李实验", detail: '{"chemicalId":1,"opType":"领用","quantity":100}', opTime: daysAgo(0, 9, 20) },
      { action: "改", module: "领用归还", operator: "李实验", detail: '{"chemicalId":6,"opType":"领用","quantity":180}', opTime: daysAgo(1, 13) },
      { action: "改", module: "领用归还", operator: "张安全", detail: '{"chemicalId":2,"opType":"废弃","quantity":50}', opTime: daysAgo(8, 14) },
      { action: "增", module: "基础信息", operator: "系统管理员", detail: '{"name":"无水乙醇","casNo":"64-17-5","category":"易制毒","safeThreshold":200}', opTime: daysAgo(3, 9, 0) },
      { action: "改", module: "库存调整", operator: "王仓管", detail: '{"chemicalId":2,"currentQuantity":90,"remark":"盘点修正，发现损耗"}', opTime: daysAgo(2, 16) },
      { action: "删", module: "基础信息", operator: "系统管理员", detail: '{"chemicalId":99,"name":"过氧化氢(废弃试剂)"}', opTime: daysAgo(10, 11) },
      { action: "增", module: "用户管理", operator: "系统管理员", detail: '{"username":"safety","realName":"张安全","role":"SAFETY"}', opTime: daysAgo(30, 10) },
      { action: "改", module: "用户管理", operator: "系统管理员", detail: '{"id":3,"role":"RESEARCHER"}', opTime: daysAgo(28, 10) },
      // 失败案例（便于"失败"状态筛选演示）
      { action: "改", module: "领用归还", operator: "李实验", detail: '[失败] 库存不足，当前仅 90g', opTime: daysAgo(2, 17, 30) },
      { action: "改", module: "库存调整", operator: "王仓管", detail: '[失败] 权限不足，该操作仅限「管理员」执行', opTime: daysAgo(5, 14) },
      { action: "增", module: "基础信息", operator: "系统管理员", detail: '[失败] 名称必填', opTime: daysAgo(7, 9) },
      { action: "删", module: "用户管理", operator: "系统管理员", detail: '[失败] 不能删除当前登录账号', opTime: daysAgo(6, 15) },
    ],
  });

  console.log("✅ 种子数据初始化完成");
  console.log("   账号：admin / warehouse / researcher / safety （密码均 123456）");
  console.log("   危化品 6 条（覆盖 充足/偏低/低于阈值/严重不足 4 档）");
  console.log("   入库/操作/审计案例数据若干");
}

main().finally(() => prisma.$disconnect());
