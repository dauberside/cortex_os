"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FileText, Filter, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ServiceRecordsPage() {
  const { data: session } = useSession();
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedTimeBand, setSelectedTimeBand] = useState<string>("");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);

  // STAFF はアクセス不可
  if (session?.user?.role === "STAFF") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-lg">このページへのアクセス権限がありません</div>
        <p className="text-muted-foreground text-sm">
          サービス実績の閲覧はリーダー以上の権限が必要です
        </p>
        <Link href="/dashboard">
          <Button>ダッシュボードに戻る</Button>
        </Link>
      </div>
    );
  }

  // 月次サマリー取得
  const { data: summary } = trpc.serviceRecord.monthlySummary.useQuery({
    year,
    month,
    recipientId: selectedRecipient || undefined,
  });

  // サービス実績一覧取得
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const { data: records, isLoading } = trpc.serviceRecord.list.useQuery({
    startDate,
    endDate,
    recipientId: selectedRecipient || undefined,
    serviceType: selectedServiceType || undefined,
    timeBand: selectedTimeBand
      ? (selectedTimeBand as "DAYTIME" | "EARLY_LATE" | "CROSSES_BANDS")
      : undefined,
    needsReview: needsReviewOnly || undefined,
    limit: 200,
  });

  // 利用者一覧取得
  const { data: recipients } = trpc.recipient.list.useQuery({});

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">
            サービス提供実績
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            月次集計・要レビュー確認・実績管理
          </p>
        </div>
      </div>

      {/* 月次サマリー */}
      {summary && (
        <div className="bg-card mb-6 grid grid-cols-2 gap-4 rounded-lg border p-6 md:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-sm">総件数</p>
            <p className="text-2xl font-bold">{summary.totalRecords}件</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">総時間</p>
            <p className="text-2xl font-bold">
              {summary.totalHours}
              <span className="text-base font-normal">時間</span>
              {summary.totalMinutes > 0 && (
                <span className="text-base font-normal">
                  {summary.totalMinutes}分
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">時間帯跨ぎ</p>
            <p className="flex items-center gap-2 text-2xl font-bold">
              {summary.crossesBandsCount > 0 && (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              {summary.crossesBandsCount}件
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">サービス種別</p>
            <p className="text-sm">
              {Object.entries(summary.byServiceType)
                .map(
                  ([type, count]) => `${getServiceTypeLabel(type)}: ${count}`
                )
                .join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* フィルタ */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">フィルタ</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-sm font-medium">年</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">月</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">利用者</label>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">全員</option>
              {recipients?.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              サービス種別
            </label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">全て</option>
              <option value="BehaviorSupport">行動援護</option>
              <option value="HomeHelp">居宅介護</option>
              <option value="VisitingCare">重度訪問介護</option>
              <option value="DayCare">生活介護</option>
              <option value="ShortStay">短期入所</option>
              <option value="GroupHome">グループホーム</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">時間帯</label>
            <select
              value={selectedTimeBand}
              onChange={(e) => setSelectedTimeBand(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">全て</option>
              <option value="DAYTIME">日中</option>
              <option value="EARLY_LATE">早朝・夜間</option>
              <option value="CROSSES_BANDS">時間帯跨ぎ</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              要レビューのみ
            </label>
            <div className="flex h-10 items-center">
              <input
                type="checkbox"
                checked={needsReviewOnly}
                onChange={(e) => setNeedsReviewOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="ml-2 text-sm">時間帯跨ぎのみ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 実績一覧 */}
      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : records && records.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground mb-4 text-lg">
              該当するサービス実績がありません
            </p>
          </div>
        ) : (
          <>
            {/* PC表示: テーブル */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      日付
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      利用者
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      サービス種別
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      時間
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      所要時間
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      時間帯
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      職員
                    </th>
                    {(session?.user?.role === "LEAD" ||
                      session?.user?.role === "MANAGER") && (
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records?.map((record: any) => (
                    <tr key={record.id} className="hover:bg-accent">
                      <td className="px-4 py-3 text-sm">
                        {new Date(record.serviceDate).toLocaleDateString(
                          "ja-JP"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {record.recipient.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getServiceTypeLabel(record.serviceType)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(record.startTime).toLocaleTimeString(
                          "ja-JP",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        〜
                        {new Date(record.endTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDuration(record.duration)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                            record.timeBand === "CROSSES_BANDS"
                              ? "bg-orange-100 text-orange-800"
                              : record.timeBand === "EARLY_LATE"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {record.timeBand === "CROSSES_BANDS" && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {getTimeBandLabel(record.timeBand)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{record.user.name}</td>
                      {(session?.user?.role === "LEAD" ||
                        session?.user?.role === "MANAGER") && (
                        <td className="px-4 py-3">
                          <Link href={`/service-records/${record.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* スマホ表示: カードリスト */}
            <div className="divide-y md:hidden">
              {records?.map((record: any) => {
                const canViewDetail =
                  session?.user?.role === "LEAD" ||
                  session?.user?.role === "MANAGER";

                const cardContent = (
                  <>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-medium">{record.recipient.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {new Date(record.serviceDate).toLocaleDateString(
                            "ja-JP"
                          )}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                          record.timeBand === "CROSSES_BANDS"
                            ? "bg-orange-100 text-orange-800"
                            : record.timeBand === "EARLY_LATE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.timeBand === "CROSSES_BANDS" && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {getTimeBandLabel(record.timeBand)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">
                          サービス:
                        </span>{" "}
                        {getServiceTypeLabel(record.serviceType)}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          時間:
                        </span>{" "}
                        {formatDuration(record.duration)}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          時刻:
                        </span>{" "}
                        {new Date(record.startTime).toLocaleTimeString(
                          "ja-JP",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        〜
                        {new Date(record.endTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          職員:
                        </span>{" "}
                        {record.user.name}
                      </div>
                    </div>
                  </>
                );

                return canViewDetail ? (
                  <Link
                    key={record.id}
                    href={`/service-records/${record.id}`}
                    className="hover:bg-accent block p-4 transition-colors"
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div key={record.id} className="block p-4">
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
