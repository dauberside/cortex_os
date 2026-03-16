"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";

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
  params: Promise<{ id: string; recordId: string }>;
}

// カテゴリ別コンテンツ表示
function ContentDisplay({
  category,
  content,
}: {
  category: string;
  content: unknown;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = content as any;

  if (category === "MEAL") {
    const mealTypeMap: Record<string, string> = {
      breakfast: "朝食",
      lunch: "昼食",
      dinner: "夕食",
      snack: "おやつ",
    };
    const intakeMap: Record<string, string> = {
      all: "全量",
      most: "ほとんど",
      half: "半量",
      little: "少量",
      none: "なし",
    };
    const textureMap: Record<string, string> = {
      normal: "普通食",
      soft: "軟菜食",
      minced: "きざみ食",
      pureed: "ペースト食",
      liquid: "流動食",
    };
    const assistanceMap: Record<string, string> = {
      independent: "自立",
      verbal: "声かけ",
      partial: "一部介助",
      full: "全介助",
    };
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem label="食事種別" value={mealTypeMap[c.mealType as string]} />
        <DetailItem label="摂取量" value={intakeMap[c.intakeAmount as string]} />
        <DetailItem
          label="食事形態"
          value={textureMap[c.foodTexture as string]}
        />
        <DetailItem
          label="介助レベル"
          value={assistanceMap[c.assistanceLevel as string]}
        />
        {c.duration && (
          <DetailItem label="所要時間" value={`${c.duration}分`} />
        )}
        {c.leftoverReason && (
          <DetailItem
            label="残食理由"
            value={c.leftoverReason as string}
            fullWidth
          />
        )}
      </dl>
    );
  }

  if (category === "EXCRETION") {
    const typeMap: Record<string, string> = {
      urination: "排尿",
      defecation: "排便",
      both: "両方",
    };
    const methodMap: Record<string, string> = {
      toilet: "トイレ",
      portable_toilet: "ポータブルトイレ",
      diaper: "おむつ",
      urinal: "尿器",
    };
    const amountMap: Record<string, string> = {
      large: "多量",
      medium: "中量",
      small: "少量",
    };
    const conditionMap: Record<string, string> = {
      normal: "正常",
      diarrhea: "下痢",
      constipation: "便秘",
      other: "その他",
    };
    const assistanceMap: Record<string, string> = {
      independent: "自立",
      verbal: "声かけ",
      partial: "一部介助",
      full: "全介助",
    };
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem label="排泄種別" value={typeMap[c.type as string]} />
        <DetailItem label="排泄方法" value={methodMap[c.method as string]} />
        <DetailItem
          label="介助レベル"
          value={assistanceMap[c.assistanceLevel as string]}
        />
        <DetailItem label="量" value={amountMap[c.amount as string]} />
        <DetailItem label="状態" value={conditionMap[c.condition as string]} />
        {c.time && <DetailItem label="時刻" value={c.time as string} />}
      </dl>
    );
  }

  if (category === "BATH") {
    const typeMap: Record<string, string> = {
      general: "一般浴",
      mechanical: "機械浴",
      shower: "シャワー浴",
      partial: "部分浴",
    };
    const assistanceMap: Record<string, string> = {
      independent: "自立",
      verbal: "声かけ",
      partial: "一部介助",
      full: "全介助",
    };
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem label="入浴方法" value={typeMap[c.bathType as string]} />
        <DetailItem
          label="介助レベル"
          value={assistanceMap[c.assistanceLevel as string]}
        />
        {c.duration && (
          <DetailItem label="所要時間" value={`${c.duration}分`} />
        )}
        {c.waterTemperature && (
          <DetailItem label="湯温" value={`${c.waterTemperature}℃`} />
        )}
        {c.skinCondition && (
          <DetailItem
            label="皮膚状態"
            value={c.skinCondition as string}
            fullWidth
          />
        )}
      </dl>
    );
  }

  if (category === "MOBILITY") {
    const typeMap: Record<string, string> = {
      indoor: "屋内移動",
      outdoor: "屋外移動",
      outing: "外出支援",
    };
    const assistanceMap: Record<string, string> = {
      independent: "自立",
      verbal: "声かけ",
      partial: "一部介助",
      full: "全介助",
    };
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem
          label="活動種別"
          value={typeMap[c.activityType as string]}
        />
        <DetailItem
          label="介助レベル"
          value={assistanceMap[c.assistanceLevel as string]}
        />
        {c.destination && (
          <DetailItem label="行き先" value={c.destination as string} />
        )}
        {c.purpose && <DetailItem label="目的" value={c.purpose as string} />}
        {c.mobilityAid && (
          <DetailItem label="移動補助具" value={c.mobilityAid as string} />
        )}
        {c.duration && (
          <DetailItem label="所要時間" value={`${c.duration}分`} />
        )}
      </dl>
    );
  }

  if (category === "COMMUNICATION") {
    const typeMap: Record<string, string> = {
      verbal: "言語",
      gesture: "ジェスチャー",
      writing: "筆談・文字盤",
      device: "意思疎通機器",
      other: "その他",
    };
    const moodMap: Record<string, string> = {
      good: "良い",
      normal: "普通",
      anxious: "不安",
      irritated: "興奮気味",
      depressed: "落ち込み",
    };
    const qualityMap: Record<string, string> = {
      clear: "良好",
      unclear: "不明確",
      difficult: "困難",
    };
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem
          label="コミュニケーション方法"
          value={typeMap[c.communicationType as string]}
        />
        <DetailItem label="気分・様子" value={moodMap[c.mood as string]} />
        <DetailItem
          label="意思疎通の質"
          value={qualityMap[c.responseQuality as string]}
        />
        {c.topic && (
          <DetailItem
            label="話題・内容"
            value={c.topic as string}
            fullWidth
          />
        )}
      </dl>
    );
  }

  if (category === "HEALTH") {
    const consciousnessMap: Record<string, string> = {
      clear: "清明",
      drowsy: "傾眠",
      confused: "混濁",
      unconscious: "昏睡",
    };
    const vitals = c.vitalSigns as Record<string, number> | undefined;
    const symptoms = c.symptoms as string[] | undefined;
    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem
          label="意識状態"
          value={consciousnessMap[c.consciousness as string]}
        />
        {vitals?.bodyTemperature && (
          <DetailItem label="体温" value={`${vitals.bodyTemperature}℃`} />
        )}
        {vitals?.pulse && (
          <DetailItem label="脈拍" value={`${vitals.pulse}回/分`} />
        )}
        {vitals?.bloodPressureSystolic && vitals?.bloodPressureDiastolic && (
          <DetailItem
            label="血圧"
            value={`${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`}
          />
        )}
        {vitals?.spO2 && (
          <DetailItem label="SpO2" value={`${vitals.spO2}%`} />
        )}
        {c.painLevel !== undefined && (
          <DetailItem label="痛みレベル" value={`${c.painLevel}/10`} />
        )}
        {c.painLocation && (
          <DetailItem label="痛みの部位" value={c.painLocation as string} />
        )}
        {symptoms && symptoms.length > 0 && (
          <div className="md:col-span-2">
            <dt className="text-sm text-gray-500">症状</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <span
                  key={s}
                  className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                >
                  {s}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    );
  }

  return (
    <pre className="text-xs text-gray-500 bg-gray-50 p-4 rounded overflow-auto">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | undefined;
  fullWidth?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default function SupportRecordDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [recipientId, setRecipientId] = useState<string>("");
  const [recordId, setRecordId] = useState<string>("");

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

  const deleteMutation = trpc.supportRecord.delete.useMutation({
    onSuccess: () => {
      router.push(`/recipients/${recipientId}/support-records`);
    },
  });

  const handleDelete = () => {
    if (!confirm("この記録を削除しますか？")) return;
    deleteMutation.mutate({ id: recordId });
  };

  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  // 編集・削除権限チェック
  const canEdit =
    record &&
    (["LEAD", "MANAGER"].includes(userRole ?? "") ||
      (record.staffId === userId &&
        Date.now() - new Date(record.createdAt).getTime() <
          24 * 60 * 60 * 1000));

  if (isLoading || !recipientId || !recordId) {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link
          href={`/recipients/${recipientId}`}
          className="hover:text-blue-500"
        >
          利用者詳細
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/recipients/${recipientId}/support-records`}
          className="hover:text-blue-500"
        >
          支援記録
        </Link>
        <span className="mx-2">/</span>
        <span>詳細</span>
      </nav>

      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                CATEGORY_COLORS[record.category as SupportCategory]
              }`}
            >
              {CATEGORY_LABELS[record.category as SupportCategory]}
            </span>
          </div>
          <h1 className="text-xl font-bold">支援記録詳細</h1>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              href={`/recipients/${recipientId}/support-records/${recordId}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              編集
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm disabled:opacity-50"
            >
              削除
            </button>
          </div>
        )}
      </div>

      {/* 基本情報 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">基本情報</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">記録日時</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {new Date(record.recordDate).toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">記録者</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {record.staff.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">作成日時</dt>
            <dd className="mt-1 text-sm text-gray-600">
              {new Date(record.createdAt).toLocaleString("ja-JP")}
            </dd>
          </div>
          {record.updatedAt !== record.createdAt && (
            <div>
              <dt className="text-sm text-gray-500">更新日時</dt>
              <dd className="mt-1 text-sm text-gray-600">
                {new Date(record.updatedAt).toLocaleString("ja-JP")}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* カテゴリ別コンテンツ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">記録内容</h2>
        <ContentDisplay category={record.category} content={record.content} />
      </div>

      {/* メモ */}
      {record.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            メモ・特記事項
          </h2>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {record.notes}
          </p>
        </div>
      )}

      {/* フッターナビ */}
      <div className="flex justify-between">
        <Link
          href={`/recipients/${recipientId}/support-records`}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          ← 一覧に戻る
        </Link>
        <Link
          href={`/recipients/${recipientId}/support-records/new`}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          + 新規記録
        </Link>
      </div>
    </div>
  );
}
