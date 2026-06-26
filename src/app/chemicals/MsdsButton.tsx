"use client";
import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Chemical = {
  name: string;
  casNo: string | null;
  category: string;
  hazardDesc: string | null;
  msdsUrl: string | null;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1">{value || "—"}</span>
    </div>
  );
}

export default function MsdsButton({ chemical }: { chemical: Chemical }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-info">
          <FileText className="h-3.5 w-3.5" />
          MSDS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MSDS 安全数据表</DialogTitle>
          <DialogDescription>{chemical.name} 的安全数据表概要</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Field label="名称" value={chemical.name} />
          <Field label="CAS 号" value={chemical.casNo} />
          <Field label="类别" value={chemical.category} />
          <Field label="危险特性" value={chemical.hazardDesc} />
        </div>
        {chemical.msdsUrl ? (
          <a
            href={chemical.msdsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-info hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            查看完整 MSDS 文档
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">暂无 MSDS 文档链接</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
