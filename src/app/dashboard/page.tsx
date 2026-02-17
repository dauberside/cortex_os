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
  const { data: unconfirmedHandovers } = trpc.handover.unconfirmedCount.useQuery();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-2">重度障害者支援システム</h1>
      <p className="text-muted-foreground mb-8">
        業務日誌・記録管理ダッシュボード
      </p>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">利用者数</p>
              <p className="text-3xl font-bold mt-1">
                {recipients?.length || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">未確認申し送り</p>
              <p className="text-3xl font-bold mt-1">
                {unconfirmedHandovers || 0}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今日の勤務</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今月のヒヤリハット</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* 機能メニュー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/recipients">
          <div className="bg-card border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">利用者管理</h3>
            <p className="text-sm text-muted-foreground">
              利用者の基本情報、障害情報、医療情報を管理
            </p>
          </div>
        </Link>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <FileText className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">支援記録</h3>
          <p className="text-sm text-muted-foreground">
            日々の支援内容（食事、排泄、入浴等）を記録
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <Activity className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">バイタルサイン</h3>
          <p className="text-sm text-muted-foreground">
            体温、血圧、脈拍などの記録と可視化
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <Pill className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">服薬管理</h3>
          <p className="text-sm text-muted-foreground">
            服薬記録、予定管理、服薬漏れアラート
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <MessageSquare className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">申し送り</h3>
          <p className="text-sm text-muted-foreground">
            シフト間の引継ぎ事項、未確認アラート
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>

        <div className="bg-card border rounded-lg p-6 opacity-50">
          <AlertTriangle className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">ヒヤリハット</h3>
          <p className="text-sm text-muted-foreground">
            ヒヤリハット・事故報告、統計分析
          </p>
          <p className="text-xs text-muted-foreground mt-2">※実装予定</p>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="mt-8 bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">クイックアクション</h2>
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
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2 text-blue-900">開発状況</h2>
        <p className="text-sm text-blue-800 mb-4">
          現在、以下の機能が実装されています：
        </p>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>✅ データベース設計（Prisma）</li>
          <li>✅ tRPCルーター（recipient/careRecord/vitalSign/medication/handover/careIncident）</li>
          <li>✅ 利用者管理画面（一覧・登録）</li>
          <li>⏳ 利用者詳細画面（実装予定）</li>
          <li>⏳ 支援記録入力画面（実装予定）</li>
          <li>⏳ バイタルサイン記録・グラフ表示（実装予定）</li>
          <li>⏳ 申し送り管理（実装予定）</li>
          <li>⏳ ヒヤリハット報告・分析（実装予定）</li>
        </ul>
        <div className="mt-4 pt-4 border-t border-blue-200">
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
