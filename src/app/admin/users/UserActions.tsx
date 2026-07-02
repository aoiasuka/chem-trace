"use client";
// 用户管理行内操作：改角色、重置密码、删除
import { useRef, useTransition, useState } from "react";
import { KeyRound, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";

const roleOptions = ALL_ROLES as Role[];

// 改角色（选择即提交）
export function RoleChangeForm({
  action,
  id,
  role,
}: {
  action: (form: FormData) => Promise<void>;
  id: number;
  role: Role;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <Select
        name="role"
        defaultValue={role}
        disabled={pending}
        className="h-8 w-28 text-xs"
        onChange={() => {
          const form = formRef.current;
          if (!form) return;
          startTransition(async () => {
            await action(new FormData(form));
          });
        }}
      >
        {roleOptions.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </Select>
    </form>
  );
}

// 重置密码弹窗
export function ResetPasswordDialog({
  action,
  id,
  username,
}: {
  action: (form: FormData) => Promise<void>;
  id: number;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pwd, setPwd] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
        setPwd("");
        setOpen(false);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-info">
          <KeyRound className="h-3.5 w-3.5" />
          重置密码
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置密码</DialogTitle>
          <DialogDescription>
            为用户「{username}」设置新密码，提交后立即生效。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <div className="space-y-1.5">
            <Label htmlFor={`pwd-${id}`}>新密码</Label>
            <Input
              id={`pwd-${id}`}
              name="password"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="至少 4 位"
              required
              minLength={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              确认重置
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 删除用户
export function UserDeleteButton({
  action,
  id,
  username,
  selfId,
}: {
  action: (form: FormData) => Promise<void>;
  id: number;
  username: string;
  selfId: number;
}) {
  const [pending, startTransition] = useTransition();
  function handleClick() {
    if (!confirm(`确定删除用户「${username}」吗？此操作不可恢复。`)) return;
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("selfId", String(selfId));
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      删除
    </Button>
  );
}
