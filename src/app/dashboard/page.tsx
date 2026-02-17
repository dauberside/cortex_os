"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  FileText,
  Activity,
  Pill,
  AlertTriangle,
  MessageSquare,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { data: recipients } = trpc.recipient.list.useQuery({
    includeDeleted: false,
  });
  const { data: unconfirmedHandovers } =
    trpc.handover.unconfirmedCount.useQuery();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-4xl font-bold">重度障害者支援システム</h1>
      <p className="text-muted-foreground mb-8">
        業務日誌・記録管理ダッシュボード
      </p>

      {/* 統計カード */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">利用者数</p>
              <p className="mt-1 text-3xl font-bold">
                {recipients?.length || 0}
              </p>
            </div>
            <Users className="text-muted-foreground h-8 w-8" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">未確認申し送り</p>
              <p className="mt-1 text-3xl font-bold">
                {unconfirmedHandovers || 0}
              </p>
            </div>
            <MessageSquare className="text-destructive h-8 w-8" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">今日の勤務</p>
              <p className="mt-1 text-3xl font-bold">-</p>
            </div>
            <Calendar className="text-muted-foreground h-8 w-8" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                今月のヒヤリハット
              </p>
              <p className="mt-1 text-3xl font-bold">-</p>
            </div>
            <AlertTriangle className="text-muted-foreground h-8 w-8" />
          </div>
        </div>
      </div>

      {/* 機能メニュー */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/recipients">
          <div className="bg-card hover:bg-accent cursor-pointer rounded-lg border p-6 transition-colors">
            <Users className="text-primary mb-4 h-10 w-10" />
            <h3 className="mb-2 text-xl font-semibold">利用者管理</h3>
            <p className="text-muted-foreground text-sm">
              利用者の基本情報、障害情報、医療情報を管理
            </p>
          </div>
        </Link>

        <div className="bg-card rounded-lg border p-6 opacity-50">
          <FileText className="text-primary mb-4 h-10 w-10" />
          <h3 className="mb-2 text-xl font-semibold">支援記録</h3>
          <p className="text-muted-foreground text-sm">
            日々の支援内容（食事、排泄、入浴等）を記録
          </p>
          <p className="text-muted-foreground mt-2 text-xs">※実装予定</p>
        </div>

        <div className="bg-card rounded-lg border p-6 opacity-50">
          <Activity className="text-primary mb-4 h-10 w-10" />
          <h3 className="mb-2 text-xl font-semibold">バイタルサイン</h3>
          <p className="text-muted-foreground text-sm">
            体温、血圧、脈拍などの記録と可視化
          </p>
          <p className="text-muted-foreground mt-2 text-xs">※実装予定</p>
        </div>

        <div className="bg-card rounded-lg border p-6 opacity-50">
          <Pill className="text-primary mb-4 h-10 w-10" />
          <h3 className="mb-2 text-xl font-semibold">服薬管理</h3>
          <p className="text-muted-foreground text-sm">
            服薬記録、予定管理、服薬漏れアラート
          </p>
          <p className="text-muted-foreground mt-2 text-xs">※実装予定</p>
        </div>

        <div className="bg-card rounded-lg border p-6 opacity-50">
          <MessageSquare className="text-primary mb-4 h-10 w-10" />
          <h3 className="mb-2 text-xl font-semibold">申し送り</h3>
          <p className="text-muted-foreground text-sm">
            シフト間の引継ぎ事項、未確認アラート
          </p>
          <p className="text-muted-foreground mt-2 text-xs">※実装予定</p>
        </div>

        <div className="bg-card rounded-lg border p-6 opacity-50">
          <AlertTriangle className="text-primary mb-4 h-10 w-10" />
          <h3 className="mb-2 text-xl font-semibold">ヒヤリハット</h3>
          <p className="text-muted-foreground text-sm">
            ヒヤリハット・事故報告、統計分析
          </p>
          <p className="text-muted-foreground mt-2 text-xs">※実装予定</p>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-card mt-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">クイックアクション</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/recipients/new">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              新規利用者登録
            </Button>
          </Link>
          <Button variant="outline" disabled>
            <FileText className="mr-2 h-4 w-4" />
            支援記録作成
          </Button>
          <Button variant="outline" disabled>
            <Activity className="mr-2 h-4 w-4" />
            バイタル記録
          </Button>
          <Button variant="outline" disabled>
            <MessageSquare className="mr-2 h-4 w-4" />
            申し送り作成
          </Button>
        </div>
      </div>

      {/* 開発状況 */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-blue-900">開発状況</h2>
        <p className="mb-4 text-sm text-blue-800">
          現在、以下の機能が実装されています：
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
          <li>✅ データベース設計（Prisma）</li>
          <li>
            ✅
            tRPCルーター（recipient/careRecord/vitalSign/medication/handover/careIncident）
          </li>
          <li>✅ 利用者管理画面（一覧・登録）</li>
          <li>⏳ 利用者詳細画面（実装予定）</li>
          <li>⏳ 支援記録入力画面（実装予定）</li>
          <li>⏳ バイタルサイン記録・グラフ表示（実装予定）</li>
          <li>⏳ 申し送り管理（実装予定）</li>
          <li>⏳ ヒヤリハット報告・分析（実装予定）</li>
        </ul>
        <div className="mt-4 border-t border-blue-200 pt-4">
          <p className="text-sm text-blue-800">
            <strong>旧システム（ノート管理）へのアクセス：</strong>
          </p>
          <Link href="/">
            <Button variant="outline" size="sm" className="mt-2">
              ノート管理画面へ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
