"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  MealForm,
  createDefaultMealContent,
  type MealContent,
} from "@/components/support-records/category-forms/MealForm";

type SupportCategory =
  | "MEAL"
  | "EXCRETION"
  | "BATH"
  | "MOBILITY"
  | "COMMUNICATION"
  | "HEALTH";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewSupportRecordPage({ params }: PageProps) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState<string>("");
  const [category, setCategory] = useState<SupportCategory>("MEAL");
  const [recordDate, setRecordDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [content, setContent] = useState<any>(createDefaultMealContent());
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  // params を解決
  useEffect(() => {
    params.then((p) => setRecipientId(p.id));
  }, [params]);

  const { data: recipient, isLoading: recipientLoading } =
    trpc.recipient.get.useQuery(
      { id: recipientId },
      { enabled: !!recipientId }
    );

  const createMutation = trpc.supportRecord.create.useMutation({
    onSuccess: () => {
      router.push(`/recipients/${recipientId}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recipientId) {
      setError("利用者IDが不正です");
      return;
    }

    try {
      await createMutation.mutateAsync({
        recipientId,
        recordDate: new Date(recordDate),
        category,
        content,
        notes: notes || undefined,
      });
    } catch (err) {
      // エラーは onError で処理
    }
  };

  const handleCategoryChange = (newCategory: SupportCategory) => {
    setCategory(newCategory);
    // カテゴリ変更時にデフォルトコンテンツをリセット
    switch (newCategory) {
      case "MEAL":
        setContent(createDefaultMealContent());
        break;
      // 他のカテゴリは後で実装
      default:
        setContent({});
    }
  };

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">支援記録作成</h1>
        <p className="text-gray-600">
          利用者: {recipient.name}（{recipient.nameKana}）
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
          <label htmlFor="recordDate" className="block text-sm font-medium mb-2">
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

        {/* カテゴリ選択 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            記録カテゴリ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: "MEAL", label: "🍽️ 食事", color: "orange" },
              {
                value: "EXCRETION",
                label: "🚽 排泄",
                color: "blue",
                disabled: true,
              },
              {
                value: "BATH",
                label: "🛁 入浴",
                color: "cyan",
                disabled: true,
              },
              {
                value: "MOBILITY",
                label: "🚶 移動・外出",
                color: "green",
                disabled: true,
              },
              {
                value: "COMMUNICATION",
                label: "💬 コミュニケーション",
                color: "purple",
                disabled: true,
              },
              {
                value: "HEALTH",
                label: "❤️ 健康状態",
                color: "red",
                disabled: true,
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() =>
                  handleCategoryChange(option.value as SupportCategory)
                }
                className={`px-4 py-3 rounded-md border transition-colors text-left ${
                  category === option.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                } ${
                  option.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="font-medium">{option.label}</div>
                {option.disabled && (
                  <div className="text-xs mt-1 opacity-70">未実装</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* カテゴリ別フォーム */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">記録内容</h2>
          {category === "MEAL" && (
            <MealForm
              value={content}
              onChange={setContent}
              disabled={createMutation.isPending}
            />
          )}
          {category !== "MEAL" && (
            <div className="text-center text-gray-500 py-8">
              このカテゴリのフォームは未実装です
            </div>
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
            disabled={createMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="特記事項があれば記入してください"
          />
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || category !== "MEAL"}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
