// 路由保护（成员E）—— 使用边缘安全配置，避免在 Edge 运行时加载 Prisma
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/chemicals/:path*",
    "/stock-in/:path*",
    "/operations/:path*",
    "/warning/:path*",
    "/audit/:path*",
  ],
};
