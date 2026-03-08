"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import {
  Users,
  FileText,
  Activity,
  MessageSquare,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: recipients } = trpc.recipient.list.useQuery({
    includeDeleted: false,
  });
  const { data: unconfirmedHandovers } =
    trpc.handover.unconfirmedCount.useQuery();

  const userRole = session?.user?.role;

  const stats = [
    {
      label: "利用者数",
      value: recipients?.length ?? "-",
      icon: Users,
      href: "/recipients",
    },
    {
      label: "未確認申し送り",
      value: unconfirmedHandovers ?? 0,
      icon: MessageSquare,
      href: null,
      alert: (unconfirmedHandovers ?? 0) > 0,
    },
    {
      label: "今日の勤務",
      value: "-",
      icon: Calendar,
      href: null,
    },
    {
      label: "今月のヒヤリハット",
      value: "-",
      icon: AlertTriangle,
      href: null,
    },
  ];

  const menus = [
    {
      href: "/recipients",
      icon: Users,
      label: "利用者情報",
      desc: "基本情報・障害情報・医療情報",
      roles: ["STAFF", "LEAD", "MANAGER"],
    },
    {
      href: "/units",
      icon: FileText,
      label: "ユニット管理",
      desc: "ユニット・業務日誌",
      roles: ["STAFF", "LEAD", "MANAGER"],
    },
    {
      href: "/service-records",
      icon: ClipboardCheck,
      label: "サービス実績",
      desc: "月次集計・要レビュー確認",
      roles: ["LEAD", "MANAGER"],
    },
    {
      href: "/ai",
      icon: Activity,
      label: "AIチャット",
      desc: "支援に関する相談・情報収集",
      roles: ["STAFF", "LEAD", "MANAGER"],
    },
    {
      href: "/audit-logs",
      icon: Shield,
      label: "監査ログ",
      desc: "システム操作履歴・提出後編集確認",
      roles: ["MANAGER"],
    },
  ];

  const visibleMenus = menus.filter(
    (menu) => !userRole || menu.roles.includes(userRole)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">ダッシュボード</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        重度障害者支援システム
      </p>

      {/* 統計カード: 2列グリッド */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-lg border p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-muted-foreground text-xs">{s.label}</p>
              <s.icon
                className={`h-5 w-5 ${s.alert ? "text-destructive" : "text-muted-foreground"}`}
              />
            </div>
            <p className={`text-2xl font-bold ${s.alert ? "text-destructive" : ""}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* メニュー */}
      <div className="bg-card rounded-lg border divide-y">
        {visibleMenus.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="hover:bg-accent flex items-center gap-4 px-4 py-4 transition-colors"
          >
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <m.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{m.label}</p>
              <p className="text-muted-foreground truncate text-sm">{m.desc}</p>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
