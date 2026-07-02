// 边缘安全的基础认证配置（不含 Prisma）——供 proxy(middleware) 使用
import type { NextAuthConfig } from "next-auth";
import { type Role, canAccessRoute } from "@/lib/permissions";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // Credentials provider 在 auth.ts 中注入（需 Prisma，仅 Node 运行时）
  callbacks: {
    // 路由级 RBAC：未登录拒绝；已登录按角色校验可访问路由
    authorized({ auth, request }) {
      const user = auth?.user;
      if (!user) return false;
      const role = (user as { role?: string }).role as Role | undefined;
      const pathname = request.nextUrl.pathname;
      return canAccessRoute(role, pathname);
    },
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
};
