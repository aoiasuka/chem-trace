"use server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prev: string | undefined, form: FormData) {
  try {
    await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirectTo: "/chemicals",
    });
  } catch (e) {
    if (e instanceof AuthError) return "用户名或密码错误";
    throw e; // redirect 也是抛错，需重新抛出
  }
}
