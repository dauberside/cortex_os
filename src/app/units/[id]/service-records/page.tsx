"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, FileText, XCircle } from "lucide-react";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GroupHome: "グループホーム",
  DayCare: "生活介護",
  HomeHelp: "居宅介護",
  VisitingCare: "重度訪問介護",
  BehaviorSupport: "行動援護",
  ShortStay: "短期入所",
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m > 0 ? `${m}分` : ""}` : `${m}分`;
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ApprovalBadge({ isApproved }: { isApproved: boolean }) {
  if (isApproved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle className="h-3 w-3" />
        承認済
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
      <Clock className="h-3 w-3" />
      未承認
    </span>
  );
}

export default function UnitServiceRecordsPage() {
  const params = useParams();
  const unitId = params.id as string;
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const currentDate = new Date();
  const [yearMonth, setYearMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const canApprove =
    session?.user?.role === "LEAD" || session?.user?.role === "MANAGER";

  const { data, isLoading } = trpc.serviceRecord.listByUnit.useQuery({
    unitId,
    yearMonth,
  });

  const approveMutation = trpc.serviceRecord.approve.useMutation({
    onSuccess: () => {
      showToast("承認しました", "success");
      utils.serviceRecord.listByUnit.invalidate({ unitId, yearMonth });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const rejectMutation = trpc.serviceRecord.reject.useMutation({
    onSuccess: () => {
      showToast("差戻しました", "success");
      utils.serviceRecord.listByUnit.invalidate({ unitId, yearMonth });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 年・月のセレクタ用
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  return (
    <div className="container mx-auto px-4 py-8">
      {toast && (
        <div
          className={`fixed right-4 bottom-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* パンくず */}
      <div className="mb-6">
        <Link
          href={`/units/${unitId}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          ユニット詳細に戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">月次サービス提供記録</h1>
        <p className="text-muted-foreground text-sm">
          在籍利用者のサービス実績一覧・承認管理
        </p>
      </div>

      {/* 年月セレクタ */}
      <div className="bg-card mb-6 flex items-center gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">年</label>
          <select
            value={year}
            onChange={(e) =>
              setYearMonth(
                `${e.target.value}-${String(month).padStart(2, "0")}`
              )
            }
            className="rounded-md border px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">月</label>
          <select
            value={month}
            onChange={(e) =>
              setYearMonth(
                `${year}-${String(e.target.value).padStart(2, "0")}`
              )
            }
            className="rounded-md border px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
        {data && (
          <p className="text-muted-foreground ml-auto text-sm">
            {data.records.length}件 / 利用者{data.recipients.length}名
          </p>
        )}
      </div>

      {/* サマリーカード & 未承認警告 */}
      {isLoading ? (
        <div className="bg-card mb-6 grid animate-pulse grid-cols-3 gap-4 rounded-lg border p-4">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
              <div className="h-7 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : data && data.records.length > 0 && (() => {
        const approvedCount = data.records.filter((r) => r.isApproved).length;
        const unapprovedCount = data.records.length - approvedCount;
        const approvedMinutes = data.records
          .filter((r) => r.isApproved)
          .reduce((sum, r) => sum + r.duration, 0);

        return (
          <>
            {unapprovedCount > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                未承認のサービス実績が{" "}
                <span className="font-bold">{unapprovedCount}件</span>{" "}
                あります。承認作業をお願いします。
              </div>
            )}
            <div className="bg-card mb-6 grid grid-cols-3 gap-4 rounded-lg border p-4">
              <div>
                <p className="text-muted-foreground text-xs">承認済</p>
                <p className="text-xl font-bold text-green-700">
                  {approvedCount}
                  <span className="text-sm font-normal">件</span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">承認済 合計時間</p>
                <p className="text-xl font-bold">
                  {formatDuration(approvedMinutes)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">未承認</p>
                <p className={`text-xl font-bold ${unapprovedCount > 0 ? "text-yellow-700" : "text-muted-foreground"}`}>
                  {unapprovedCount}
                  <span className="text-sm font-normal">件</span>
                </p>
              </div>
            </div>
          </>
        );
      })()}

      {/* 一覧 */}
      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="animate-pulse divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-5 w-14 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : !data || data.records.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground text-lg">
              {year}年{month}月のサービス実績がありません
            </p>
          </div>
        ) : (
          <>
            {/* PC: テーブル */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      提供日
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      利用者
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      サービス種別
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      提供時間
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      担当者
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      承認状態
                    </th>
                    {canApprove && (
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.records.map((record, idx) => {
                    const logId = record.dailyLogEntry?.dailyLogId;
                    const dateStr = new Date(record.serviceDate).toLocaleDateString("ja-JP");
                    const prevDateStr = idx > 0
                      ? new Date(data.records[idx - 1].serviceDate).toLocaleDateString("ja-JP")
                      : null;
                    const isNewDate = dateStr !== prevDateStr;
                    const colSpan = canApprove ? 7 : 6;
                    return (
                      <React.Fragment key={record.id}>
                        {isNewDate && (
                          <tr className="bg-gray-50">
                            <td
                              colSpan={colSpan}
                              className="px-4 py-2 text-xs font-semibold text-gray-500"
                            >
                              {dateStr}
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-accent">
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {record.recipient.name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {SERVICE_TYPE_LABELS[record.serviceType] ??
                              record.serviceType}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatTime(record.startTime)}〜
                            {formatTime(record.endTime)}
                            <span className="text-muted-foreground ml-1">
                              ({formatDuration(record.duration)})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.user.name}
                          </td>
                          <td className="px-4 py-3">
                            <ApprovalBadge isApproved={record.isApproved} />
                          </td>
                          {canApprove && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {logId && (
                                  <Link
                                    href={`/units/${unitId}/log/${logId}`}
                                    className="text-muted-foreground hover:text-foreground text-xs underline"
                                  >
                                    日誌
                                  </Link>
                                )}
                                {!record.isApproved ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    disabled={approveMutation.isPending}
                                    onClick={() =>
                                      approveMutation.mutate({ id: record.id })
                                    }
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    承認
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-red-600 hover:text-red-700"
                                    disabled={rejectMutation.isPending}
                                    onClick={() =>
                                      rejectMutation.mutate({ id: record.id })
                                    }
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    差戻
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* スマホ: カードリスト */}
            <div className="divide-y md:hidden">
              {data.records.map((record, idx) => {
                const logId = record.dailyLogEntry?.dailyLogId;
                const dateStr = new Date(record.serviceDate).toLocaleDateString("ja-JP");
                const prevDateStr = idx > 0
                  ? new Date(data.records[idx - 1].serviceDate).toLocaleDateString("ja-JP")
                  : null;
                const isNewDate = dateStr !== prevDateStr;
                return (
                  <React.Fragment key={record.id}>
                    {isNewDate && (
                      <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
                        {dateStr}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-medium">{record.recipient.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {dateStr}
                          </p>
                        </div>
                        <ApprovalBadge isApproved={record.isApproved} />
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-1 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">
                            サービス:{" "}
                          </span>
                          {SERVICE_TYPE_LABELS[record.serviceType] ??
                            record.serviceType}
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            時間:{" "}
                          </span>
                          {formatDuration(record.duration)}
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            時刻:{" "}
                          </span>
                          {formatTime(record.startTime)}〜
                          {formatTime(record.endTime)}
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">
                            担当:{" "}
                          </span>
                          {record.user.name}
                        </div>
                      </div>
                      {canApprove && (
                        <div className="flex items-center gap-2">
                          {logId && (
                            <Link
                              href={`/units/${unitId}/log/${logId}`}
                              className="text-muted-foreground hover:text-foreground text-xs underline"
                            >
                              日誌を見る
                            </Link>
                          )}
                          {!record.isApproved ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={approveMutation.isPending}
                              onClick={() =>
                                approveMutation.mutate({ id: record.id })
                              }
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              承認
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-600 hover:text-red-700"
                              disabled={rejectMutation.isPending}
                              onClick={() =>
                                rejectMutation.mutate({ id: record.id })
                              }
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              差戻
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
