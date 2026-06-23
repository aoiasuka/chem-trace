// Auth.js (NextAuth v5) 完整配置（成员E）—— 含 Prisma，运行于 Node 运行时
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(c) {
        if (!c?.username || !c?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: String(c.username) },
        });
        if (user && (await bcrypt.compare(String(c.password), user.password))) {
          return { id: String(user.id), name: user.realName, role: user.role };
        }
        return null;
      },
    }),
  ],
});
