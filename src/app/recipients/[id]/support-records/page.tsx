"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type SupportCategory =
  | "MEAL"
  | "EXCRETION"
  | "BATH"
  | "MOBILITY"
  | "COMMUNICATION"
  | "HEALTH";

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  MEAL: "🍽️ 食事",
  EXCRETION: "🚽 排泄",
  BATH: "🛁 入浴",
  MOBILITY: "🚶 移動・外出",
  COMMUNICATION: "💬 コミュニケーション",
  HEALTH: "❤️ 健康状態",
};

const CATEGORY_COLORS: Record<SupportCategory, string> = {
  MEAL: "bg-orange-100 text-orange-800",
  EXCRETION: "bg-blue-100 text-blue-800",
  BATH: "bg-cyan-100 text-cyan-800",
  MOBILITY: "bg-green-100 text-green-800",
  COMMUNICATION: "bg-purple-100 text-purple-800",
  HEALTH: "bg-red-100 text-red-800",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SupportRecordsPage({ params }: PageProps) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | undefined>();

  // params を解決
  useEffect(() => {
    params.then((p) => setRecipientId(p.id));
  }, [params]);

  const { data: recipient, isLoading: recipientLoading } =
    trpc.recipient.get.useQuery(
      { id: recipientId },
      { enabled: !!recipientId }
    );

  const { data: records, isLoading: recordsLoading } =
    trpc.supportRecord.list.useQuery(
      {
        recipientId,
        category: selectedCategory,
        limit: 50,
      },
      { enabled: !!recipientId }
    );

  if (recipientLoading || !recipientId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">利用者が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">支援記録</h1>
            <p className="text-gray-600">
              利用者: {recipient.name}（{recipient.nameKana}）
            </p>
          </div>
          <Link
            href={`/recipients/${recipientId}/support-records/new`}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            + 新規記録
          </Link>
        </div>

        {/* カテゴリフィルタ */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === undefined
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            すべて
          </button>
          {(Object.keys(CATEGORY_LABELS) as SupportCategory[]).map(
            (category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            )
          )}
        </div>
      </div>

      {/* 記録一覧 */}
      {recordsLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : !records || records.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">記録がありません</p>
          <Link
            href={`/recipients/${recipientId}/support-records/new`}
            className="text-blue-500 hover:underline"
          >
            最初の記録を作成する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(
                  `/recipients/${recipientId}/support-records/${record.id}`
                )
              }
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      CATEGORY_COLORS[record.category as SupportCategory]
                    }`}
                  >
                    {CATEGORY_LABELS[record.category as SupportCategory]}
                  </span>
                  <span className="text-gray-600">
                    {new Date(record.recordDate).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  記録者: {record.staff.name}
                </span>
              </div>

              {/* コンテンツプレビュー（MEALの場合） */}
              {record.category === "MEAL" && (
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    食事種別:{" "}
                    {
                      ({
                        breakfast: "朝食",
                        lunch: "昼食",
                        dinner: "夕食",
                        snack: "おやつ",
                      } as any)[record.content.mealType]
                    }
                  </div>
                  <div>
                    摂取量:{" "}
                    {
                      ({
                        all: "全量",
                        most: "ほとんど",
                        half: "半量",
                        little: "少量",
                        none: "なし",
                      } as any)[record.content.intakeAmount]
                    }
                  </div>
                </div>
              )}

              {record.notes && (
                <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                  メモ: {record.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
