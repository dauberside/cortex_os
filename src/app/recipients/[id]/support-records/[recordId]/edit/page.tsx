"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  MealForm,
} from "@/components/support-records/category-forms/MealForm";
import {
  ExcretionForm,
} from "@/components/support-records/category-forms/ExcretionForm";
import {
  BathForm,
} from "@/components/support-records/category-forms/BathForm";
import {
  MobilityForm,
} from "@/components/support-records/category-forms/MobilityForm";
import {
  CommunicationForm,
} from "@/components/support-records/category-forms/CommunicationForm";
import {
  HealthForm,
} from "@/components/support-records/category-forms/HealthForm";

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

interface PageProps {
  params: Promise<{ id: string; recordId: string }>;
}

export default function EditSupportRecordPage({ params }: PageProps) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState<string>("");
  const [recordId, setRecordId] = useState<string>("");
  const [recordDate, setRecordDate] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any>(null);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setRecipientId(p.id);
      setRecordId(p.recordId);
    });
  }, [params]);

  const { data: record, isLoading } = trpc.supportRecord.getById.useQuery(
    { id: recordId },
    { enabled: !!recordId }
  );

  // 既存データで初期化（一回だけ）
  useEffect(() => {
    if (record && !initialized) {
      setRecordDate(
        new Date(record.recordDate).toISOString().slice(0, 16)
      );
      setContent(record.content);
      setNotes(record.notes ?? "");
      setInitialized(true);
    }
  }, [record, initialized]);

  const updateMutation = trpc.supportRecord.update.useMutation({
    onSuccess: () => {
      router.push(
        `/recipients/${recipientId}/support-records/${recordId}`
      );
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await updateMutation.mutateAsync({
        id: recordId,
        recordDate: new Date(recordDate),
        content,
        notes: notes || undefined,
      });
    } catch {
      // エラーは onError で処理
    }
  };

  if (isLoading || !recipientId || !recordId || !initialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">記録が見つかりません</div>
      </div>
    );
  }

  const category = record.category as SupportCategory;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">支援記録編集</h1>
        <p className="text-gray-600">
          カテゴリ: {CATEGORY_LABELS[category]}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 記録日時 */}
        <div>
          <label
            htmlFor="recordDate"
            className="block text-sm font-medium mb-2"
          >
            記録日時 <span className="text-red-500">*</span>
          </label>
          <input
            id="recordDate"
            type="datetime-local"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* カテゴリ別フォーム */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">記録内容</h2>
          {category === "MEAL" && (
            <MealForm
              value={content as Parameters<typeof MealForm>[0]["value"]}
              onChange={setContent}
              disabled={updateMutation.isPending}
            />
          )}
          {category === "EXCRETION" && (
            <ExcretionForm
              value={content as Parameters<typeof ExcretionForm>[0]["value"]}
              onChange={setContent}
              disabled={updateMutation.isPending}
            />
          )}
          {category === "BATH" && (
            <BathForm
              value={content as Parameters<typeof BathForm>[0]["value"]}
              onChange={setContent}
              disabled={updateMutation.isPending}
            />
          )}
          {category === "MOBILITY" && (
            <MobilityForm
              value={content as Parameters<typeof MobilityForm>[0]["value"]}
              onChange={setContent}
              disabled={updateMutation.isPending}
            />
          )}
          {category === "COMMUNICATION" && (
            <CommunicationForm
              value={
                content as Parameters<typeof CommunicationForm>[0]["value"]
              }
              onChange={setContent}
              disabled={updateMutation.isPending}
            />
          )}
          {category === "HEALTH" && (
            <HealthForm
              value={content as Parameters<typeof HealthForm>[0]["value"]}
              onChange={setContent}
              disabled={updateMutation.isPending}
            />
          )}
        </div>

        {/* メモ・特記事項 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            メモ・特記事項
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={updateMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="特記事項があれば記入してください"
          />
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-6 border-t">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/recipients/${recipientId}/support-records/${recordId}`
              )
            }
            disabled={updateMutation.isPending}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
