// 角色与权限映射（纯常量，Edge 运行时安全，不依赖 Prisma / auth）
// 供 proxy.ts 的 authorized 回调与导航栏复用

export type Role = "ADMIN" | "WAREHOUSE" | "RESEARCHER" | "SAFETY";

export const ALL_ROLES: Role[] = ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "管理员",
  WAREHOUSE: "仓库管理员",
  RESEARCHER: "实验人员",
  SAFETY: "安全负责人",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "用户管理、基础数据维护、审计查看",
  WAREHOUSE: "入库、库存调整",
  RESEARCHER: "领用、归还",
  SAFETY: "预警、审计、废弃审批",
};

// 路由 → 允许访问的角色集合
export const ROUTE_ROLES: Record<string, Role[]> = {
  "/": ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"],
  "/chemicals": ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"],
  "/stock-in": ["ADMIN", "WAREHOUSE"],
  "/operations": ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"],
  "/warning": ["ADMIN", "SAFETY"],
  "/audit": ["ADMIN", "SAFETY"],
  "/admin/users": ["ADMIN"],
  "/dashboard": ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"],
};

// 顶部导航项（含角色限制）
export type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  warnCount?: number;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "仪表盘", roles: ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"] },
  { href: "/chemicals", label: "基础信息库", roles: ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"] },
  { href: "/stock-in", label: "入库管理", roles: ["ADMIN", "WAREHOUSE"] },
  { href: "/operations", label: "领用归还", roles: ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"] },
  { href: "/warning", label: "库存预警", roles: ["ADMIN", "SAFETY"] },
  { href: "/audit", label: "审计日志", roles: ["ADMIN", "SAFETY"] },
  { href: "/admin/users", label: "用户管理", roles: ["ADMIN"] },
];

/**
 * 判断某角色能否访问某路径（供 authorized 回调使用）
 * 未在 ROUTE_ROLES 中登记的受保护路径默认放行已登录用户。
 */
export function canAccessRoute(role: Role | undefined | null, pathname: string): boolean {
  if (!role) return false;
  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return roles.includes(role);
    }
  }
  return true;
}

// 操作权限（用于 Server Action 内部校验）
export const OP_ROLES = {
  // 基础数据维护（危化品增删改）
  chemicalManage: ["ADMIN"] as Role[],
  // 库存盘点调整
  stockAdjust: ["ADMIN", "WAREHOUSE"] as Role[],
  // 入库
  stockIn: ["ADMIN", "WAREHOUSE"] as Role[],
  // 领用 / 归还
  borrowReturn: ["ADMIN", "WAREHOUSE", "RESEARCHER", "SAFETY"] as Role[],
  // 废弃（即废弃审批，由安全负责人/管理员执行）
  dispose: ["ADMIN", "SAFETY"] as Role[],
  // 用户管理
  userManage: ["ADMIN"] as Role[],
};

export function hasPermission(role: Role | undefined | null, allowed: Role[]): boolean {
  return !!role && allowed.includes(role);
}
