// 用户管理页面（仅管理员）
import { Plus, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  listUsers,
  createUser,
  updateUserRole,
  resetPassword,
  deleteUser,
} from "./actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type Role,
} from "@/lib/permissions";
import {
  RoleChangeForm,
  ResetPasswordDialog,
  UserDeleteButton,
} from "./UserActions";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const selfId = Number(session.user.id ?? 0);

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="用户管理"
        description="维护系统账号、分配角色权限（管理员专属）"
      />

      {/* 角色权限说明 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            角色权限说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_ROLES.map((r) => (
              <div
                key={r}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <Badge variant="secondary" className="mb-1.5">
                  {ROLE_LABELS[r]}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[r]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 新增用户 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            新增用户
          </CardTitle>
          <CardDescription>新用户默认密码可在创建后重置</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createUser}
            className="grid grid-cols-2 gap-3 md:grid-cols-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="u-username">用户名</Label>
              <Input id="u-username" name="username" placeholder="登录用户名" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-realName">真实姓名</Label>
              <Input id="u-realName" name="realName" placeholder="真实姓名" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password">初始密码</Label>
              <Input
                id="u-password"
                name="password"
                type="password"
                placeholder="至少 4 位"
                required
                minLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-role">角色</Label>
              <Select id="u-role" name="role" defaultValue="RESEARCHER">
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                创建用户
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">共 {users.length} 个账号</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>用户名</TableHead>
                <TableHead>真实姓名</TableHead>
                <TableHead className="text-center">当前角色</TableHead>
                <TableHead className="text-center">修改角色</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === selfId;
                const isBuiltin = u.username === "admin";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.username}
                      {isSelf && (
                        <Badge variant="info" className="ml-2">
                          当前登录
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.realName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {ROLE_LABELS[u.role as Role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {isBuiltin ? (
                        <span className="text-xs text-muted-foreground">
                          内置不可改
                        </span>
                      ) : (
                        <RoleChangeForm
                          action={updateUserRole}
                          id={u.id}
                          role={u.role as Role}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <ResetPasswordDialog
                          action={resetPassword}
                          id={u.id}
                          username={u.username}
                        />
                        {!isBuiltin && (
                          <UserDeleteButton
                            action={deleteUser}
                            id={u.id}
                            username={u.username}
                            selfId={selfId}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    暂无用户
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
