// 路由保护（成员E）—— 使用边缘安全配置，避免在 Edge 运行时加载 Prisma
// Next.js 16: middleware → proxy 重命名
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
