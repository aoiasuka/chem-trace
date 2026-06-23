// 边缘安全的基础认证配置（不含 Prisma）——供 middleware 使用
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // Credentials provider 在 auth.ts 中注入（需 Prisma，仅 Node 运行时）
  callbacks: {
    authorized({ auth }) {
      // matcher 命中的业务路由：必须已登录
      return !!auth?.user;
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
