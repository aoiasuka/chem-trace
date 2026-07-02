import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getWarningLevel,
  isWarning,
} from "@/lib/warning";
import DashboardClient from "./DashboardClient";

type ChemData = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  safeThreshold: number;
  level: "normal" | "low" | "below" | "critical";
  ratio: number;
};

type OpDay = {
  date: string;
  label: string;
  borrow: number;
  return: number;
  dispose: number;
  stockIn: number;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function fetchDashboardData() {
  const today = startOfToday();
  const [chemicals, todayStockIn, allOps, recentAudits] = await Promise.all([
    prisma.chemical.findMany({ orderBy: { id: "asc" } }),
    prisma.stockIn.findMany({
      where: { inDate: { gte: today } },
      include: { chemical: true },
      orderBy: { inDate: "desc" },
    }),
    prisma.opLog.findMany({
      include: { chemical: true },
      orderBy: { opTime: "desc" },
      take: 200,
    }),
    prisma.auditLog.findMany({
      orderBy: { opTime: "desc" },
      take: 12,
    }),
  ]);

  const chemList: ChemData[] = chemicals.map((c) => ({
    ...c,
    level: getWarningLevel(c.currentQuantity, c.safeThreshold),
    ratio:
      c.safeThreshold > 0
        ? Math.round((c.currentQuantity / c.safeThreshold) * 100)
        : 100,
  }));

  const byCategory = new Map<string, number>();
  for (const c of chemicals) {
    byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1);
  }

  const levelCount = { normal: 0, low: 0, below: 0, critical: 0 };
  for (const c of chemList) levelCount[c.level]++;

  const days: OpDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(5, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      borrow: 0,
      return: 0,
      dispose: 0,
      stockIn: 0,
    });
  }

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const opsInWeek = allOps.filter(
    (o) => o.opTime >= weekStart && o.opTime <= new Date(),
  );
  for (const op of opsInWeek) {
    const dayIdx = days.findIndex(
      (d) => d.date === op.opTime.toISOString().slice(5, 10),
    );
    if (dayIdx < 0) continue;
    if (op.opType === "领用") days[dayIdx].borrow += op.quantity;
    else if (op.opType === "归还") days[dayIdx].return += op.quantity;
    else if (op.opType === "废弃") days[dayIdx].dispose += op.quantity;
  }

  const stockInsInWeek = await prisma.stockIn.findMany({
    where: { inDate: { gte: weekStart } },
    orderBy: { inDate: "desc" },
  });
  for (const si of stockInsInWeek) {
    const dayIdx = days.findIndex(
      (d) => d.date === si.inDate.toISOString().slice(5, 10),
    );
    if (dayIdx >= 0) days[dayIdx].stockIn += si.inQuantity;
  }

  return {
    chemList,
    byCategory: Array.from(byCategory.entries()),
    levelCount,
    totalChemicals: chemicals.length,
    warnCount: chemList.filter((c) =>
      isWarning(c.currentQuantity, c.safeThreshold),
    ).length,
    criticalCount: chemList.filter((c) => c.level === "critical").length,
    todayStockInCount: todayStockIn.length,
    todayStockInQty: todayStockIn.reduce((s, x) => s + x.inQuantity, 0),
    todayOpsCount: opsInWeek.filter((o) => o.opTime >= today).length,
    days,
    recentAudits,
  };
}

export default async function DataDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await fetchDashboardData();

  return <DashboardClient data={data} />;
}
