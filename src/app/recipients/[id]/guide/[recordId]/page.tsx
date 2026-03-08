"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  DollarSign,
  FileText,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { GuideRecordStatusBadge } from "@/components/guide/GuideRecordStatusBadge";
import { GuideRecordPrintView } from "@/components/guide/GuideRecordPrintView";
import { useState } from "react";

export default function GuideRecordDetailPage() {
  const params = useParams();
  const recipientId = params.id as string;
  const recordId = params.recordId as string;
  const [printViewType, setPrintViewType] = useState<"family" | "office">(
    "office"
  );

  const { data: record, isLoading } = trpc.guideRecord.get.useQuery({
    id: recordId,
  });

  const handlePrint = (viewType: "family" | "office") => {
    setPrintViewType(viewType);
    // 少し待ってから印刷ダイアログを開く（状態更新を反映するため）
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return "—";
    const minutes = Math.floor(
      (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60
    );
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}時間${m}分` : `${m}分`;
  };

  const usedAmount =
    record?.handedAmount && record?.returnedAmount !== null
      ? record.handedAmount - record.returnedAmount
      : null;

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
        <div className="text-lg">ガイド記録が見つかりません</div>
      </div>
    );
  }

  return (
    <>
      {/* 画面表示用 */}
      <div className="container mx-auto px-4 py-8 no-print">
        <Link href={`/recipients/${recipientId}/guide`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ガイド記録一覧に戻る
          </Button>
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold">ガイド記録 詳細</h1>
              <GuideRecordStatusBadge status={record.status} />
            </div>
            <p className="text-muted-foreground">
              {new Date(record.startedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePrint("family")}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              利用者用印刷
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePrint("office")}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              事務所用印刷
            </Button>
          </div>
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
                <p className="text-muted-foreground mb-1 text-sm">担当職員</p>
                <p className="font-medium">{record.user.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">実施日</p>
                <p className="font-medium">
                  {new Date(record.startedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">ステータス</p>
                <GuideRecordStatusBadge status={record.status} />
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
                  {new Date(record.startedAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">終了時刻</p>
                <p className="font-medium">
                  {record.endedAt
                    ? new Date(record.endedAt).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">所要時間</p>
                <p className="font-medium">
                  {formatDuration(record.startedAt, record.endedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* 外出情報 */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <MapPin className="h-5 w-5" />
              外出情報
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">外出先</p>
                <p className="font-medium">{record.destination || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">目的</p>
                <p className="font-medium">{record.purpose || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">集合場所</p>
                <p className="font-medium">{record.assemblyLocation || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">解散場所</p>
                <p className="font-medium">{record.dismissalLocation || "—"}</p>
              </div>
            </div>
            {record.route && Array.isArray(record.route) && record.route.length > 0 && (
              <div className="mt-4">
                <p className="text-muted-foreground mb-2 text-sm">経路</p>
                <div className="flex flex-wrap items-center gap-2">
                  {(record.route as string[]).map((place, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                        {place}
                      </span>
                      {index < (record.route as string[]).length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {record.transport && record.transport.length > 0 && (
              <div className="mt-4">
                <p className="text-muted-foreground mb-2 text-sm">移動手段</p>
                <div className="flex flex-wrap gap-2">
                  {record.transport.map((t) => (
                    <span
                      key={t}
                      className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 支援内容・利用者の様子 */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <FileText className="h-5 w-5" />
              支援内容・利用者の様子
            </h2>
            <div className="space-y-4">
              {record.supportContent && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    支援内容
                  </p>
                  <p className="whitespace-pre-wrap">{record.supportContent}</p>
                </div>
              )}
              {record.userCondition && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    利用者の様子・状態
                  </p>
                  <p className="whitespace-pre-wrap">{record.userCondition}</p>
                </div>
              )}
            </div>
          </div>

          {/* 金銭管理 */}
          {record.cashHandled && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <DollarSign className="h-5 w-5" />
                金銭管理
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    渡した金額
                  </p>
                  <p className="text-2xl font-bold">
                    {record.handedAmount?.toLocaleString() || "—"}
                    <span className="text-base font-normal">円</span>
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    使用金額
                  </p>
                  <p className="text-2xl font-bold">
                    {usedAmount !== null ? usedAmount.toLocaleString() : "—"}
                    <span className="text-base font-normal">円</span>
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">残金</p>
                  <p className="text-2xl font-bold">
                    {record.returnedAmount !== null
                      ? record.returnedAmount.toLocaleString()
                      : "—"}
                    <span className="text-base font-normal">円</span>
                  </p>
                </div>
              </div>

              {/* 金銭詳細内訳 */}
              {(record.transportExpenses || record.foodExpenses || record.otherExpenses || record.staffMealExpense) && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-muted-foreground mb-3 text-sm font-medium">
                    使用内訳
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* 交通費 */}
                    {record.transportExpenses && Array.isArray(record.transportExpenses) && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">交通費</p>
                        <div className="space-y-1">
                          {(record.transportExpenses as Array<{amount: number, description?: string}>)
                            .filter(item => item.amount > 0)
                            .map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.description || "—"}</span>
                                <span className="font-medium">{item.amount.toLocaleString()}円</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* 飲食費 */}
                    {record.foodExpenses && Array.isArray(record.foodExpenses) && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">飲食費</p>
                        <div className="space-y-1">
                          {(record.foodExpenses as Array<{amount: number, description?: string}>)
                            .filter(item => item.amount > 0)
                            .map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.description || "—"}</span>
                                <span className="font-medium">{item.amount.toLocaleString()}円</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* その他費用 */}
                    {record.otherExpenses && Array.isArray(record.otherExpenses) && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">その他</p>
                        <div className="space-y-1">
                          {(record.otherExpenses as Array<{amount: number, description?: string}>)
                            .filter(item => item.amount > 0)
                            .map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.description || "—"}</span>
                                <span className="font-medium">{item.amount.toLocaleString()}円</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* サポーター食事代 */}
                    {record.staffMealExpense && record.staffMealExpense > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">サポーター食事代</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">—</span>
                          <span className="font-medium">{record.staffMealExpense.toLocaleString()}円</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {record.cashNote && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-muted-foreground mb-1 text-sm">
                    金銭内訳・備考
                  </p>
                  <p className="whitespace-pre-wrap">{record.cashNote}</p>
                </div>
              )}
            </div>
          )}

          {/* 食事・服薬情報 */}
          {(record.mealContent || record.mealAmount || record.medicationTaken !== null) && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">食事・服薬情報</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {record.mealContent && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">食事内容</p>
                    <p className="font-medium">{record.mealContent}</p>
                  </div>
                )}
                {record.mealAmount && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">食事量</p>
                    <p className="font-medium">{record.mealAmount}</p>
                  </div>
                )}
                {record.medicationTaken !== null && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">服薬</p>
                    <p className="font-medium">
                      {record.medicationTaken ? "あり" : "なし"}
                    </p>
                  </div>
                )}
                {record.medicationTime && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm">服薬時間</p>
                    <p className="font-medium">{record.medicationTime}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 特記事項 */}
          {record.notes && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">特記事項</h2>
              <p className="whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 印刷用（非表示） */}
      {record && (
        <GuideRecordPrintView record={record} viewType={printViewType} />
      )}
    </>
  );
}
