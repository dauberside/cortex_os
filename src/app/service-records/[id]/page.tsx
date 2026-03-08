"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";

export default function ServiceRecordDetailPage() {
  const params = useParams();
  const recordId = params.id as string;

  const { data: record, isLoading } = trpc.serviceRecord.get.useQuery({
    id: recordId,
  });

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}時間${m}分` : `${m}分`;
  };

  const getTimeBandLabel = (timeBand: string | null) => {
    if (!timeBand) return "—";
    switch (timeBand) {
      case "DAYTIME":
        return "日中";
      case "EARLY_LATE":
        return "早朝・夜間";
      case "CROSSES_BANDS":
        return "時間帯跨ぎ";
      default:
        return timeBand;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case "BehaviorSupport":
        return "行動援護";
      case "HomeHelp":
        return "居宅介護";
      case "VisitingCare":
        return "重度訪問介護";
      case "DayCare":
        return "生活介護";
      case "ShortStay":
        return "短期入所";
      case "GroupHome":
        return "グループホーム";
      default:
        return serviceType;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">サービス実績が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/service-records">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          実績一覧に戻る
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">サービス提供実績 詳細</h1>
        <p className="text-muted-foreground">
          {new Date(record.serviceDate).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-6">
        {/* 基本情報 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <User className="h-5 w-5" />
            基本情報
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">利用者</p>
              <p className="font-medium">{record.recipient.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">サービス種別</p>
              <p className="font-medium">
                {getServiceTypeLabel(record.serviceType)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">提供日</p>
              <p className="font-medium">
                {new Date(record.serviceDate).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">提供職員</p>
              <p className="font-medium">{record.user.name}</p>
            </div>
          </div>
        </div>

        {/* 時間情報 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Clock className="h-5 w-5" />
            時間情報
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">開始時刻</p>
              <p className="font-medium">
                {new Date(record.startTime).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">終了時刻</p>
              <p className="font-medium">
                {new Date(record.endTime).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">所要時間</p>
              <p className="font-medium">{formatDuration(record.duration)}</p>
            </div>
          </div>

          {/* 時間帯判定 */}
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-muted-foreground text-sm">時間帯判定</p>
              {record.timeBand === "CROSSES_BANDS" && (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 rounded px-3 py-1 text-sm font-medium ${
                  record.timeBand === "CROSSES_BANDS"
                    ? "bg-orange-100 text-orange-800"
                    : record.timeBand === "EARLY_LATE"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {getTimeBandLabel(record.timeBand)}
              </span>
              {record.appliedRuleVersion && (
                <span className="text-muted-foreground text-sm">
                  適用ルール: {record.appliedRuleVersion}
                </span>
              )}
            </div>
            {record.timeBand === "CROSSES_BANDS" && (
              <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm text-orange-800">
                  ⚠️
                  この実績は時間帯を跨いでいます。請求時に分割が必要な場合があります。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* サービス内容 */}
        {(record.destination || record.purpose || record.serviceDetail) && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">サービス内容</h2>
            <div className="space-y-3">
              {record.destination && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">行き先</p>
                  <p>{record.destination}</p>
                </div>
              )}
              {record.purpose && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">目的</p>
                  <p>{record.purpose}</p>
                </div>
              )}
              {record.serviceDetail && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">詳細</p>
                  <p className="whitespace-pre-wrap">{record.serviceDetail}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 利用者の状態 */}
        {(record.userCondition || record.incidents) && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">
              利用者の様子・特記事項
            </h2>
            <div className="space-y-3">
              {record.userCondition && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    利用者の様子
                  </p>
                  <p className="whitespace-pre-wrap">{record.userCondition}</p>
                </div>
              )}
              {record.incidents && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">特記事項</p>
                  <p className="whitespace-pre-wrap">{record.incidents}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 元のガイド記録へのリンク */}
        {record.guideRecord && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">元の記録</h2>
            <div className="flex items-center gap-3">
              <Link
                href={`/recipients/${record.recipient.id}/guide/${record.guideRecord.id}/edit`}
              >
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  ガイド記録を確認
                </Button>
              </Link>
              <span className="text-muted-foreground text-sm">
                ステータス:{" "}
                {record.guideRecord.status === "SUBMITTED"
                  ? "提出済み"
                  : "下書き"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
