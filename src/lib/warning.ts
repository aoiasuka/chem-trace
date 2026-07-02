// 库存预警分级（统一阈值判断逻辑，消除三处重复的内联比较）
// 分级依据 = 当前库存 / 安全阈值 的比例：
//   充足    ratio >= 1.0   (≥100% 阈值)
//   偏低    0.8 <= ratio < 1.0  (80%-100%)
//   低于阈值 0.5 <= ratio < 0.8  (50%-80%)
//   严重不足 ratio < 0.5   (<50%)
// 比例阈值可在本文件统一调整，全站生效。

export type WarningLevel = "normal" | "low" | "below" | "critical";

export const WARNING_LEVELS: Record<
  WarningLevel,
  { label: string; badgeVariant: "success" | "warning" | "destructive" | "danger"; desc: string }
> = {
  normal: { label: "库存充足", badgeVariant: "success", desc: "≥100% 安全阈值" },
  low: { label: "库存偏低", badgeVariant: "warning", desc: "80%-100% 安全阈值" },
  below: { label: "低于阈值", badgeVariant: "destructive", desc: "50%-80% 安全阈值" },
  critical: { label: "严重不足", badgeVariant: "danger", desc: "<50% 安全阈值" },
};

/** 计算库存占阈值的比例（阈值<=0 视为未设阈值，返回 1 表示充足） */
export function stockRatio(current: number, threshold: number): number {
  if (threshold <= 0) return 1;
  return current / threshold;
}

/** 取预警分级 */
export function getWarningLevel(current: number, threshold: number): WarningLevel {
  const ratio = stockRatio(current, threshold);
  if (ratio >= 1) return "normal";
  if (ratio >= 0.8) return "low";
  if (ratio >= 0.5) return "below";
  return "critical";
}

/** 是否处于预警状态（非充足即预警，等价于原来的 current < threshold） */
export function isWarning(current: number, threshold: number): boolean {
  return getWarningLevel(current, threshold) !== "normal";
}

/** 预警等级排序权重，便于按严重程度排序 */
export const LEVEL_WEIGHT: Record<WarningLevel, number> = {
  critical: 0,
  below: 1,
  low: 2,
  normal: 3,
};
