"use client";

import { useRef, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  id,
  name,
}: {
  action: (form: FormData) => Promise<void>;
  id: number;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    if (!confirm(`确定删除「${name}」吗？\n关联的入库和操作记录也会一并清除。`)) return;
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="id" value={id} />
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
    </form>
  );
}
