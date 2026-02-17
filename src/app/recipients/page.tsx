"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  UserPlus,
  Users,
  Download,
  Upload,
  Trash2,
  Filter,
  X,
  Edit,
} from "lucide-react";
import Link from "next/link";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  HomeHelp: "居宅介護",
  VisitingCare: "重度訪問介護",
  BehaviorSupport: "行動援護",
  MobilitySupport: "同行援護",
  DayCare: "生活介護",
  ShortStay: "短期入所",
  GroupHome: "グループホーム",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  HomeHelp: "bg-blue-100 text-blue-800",
  VisitingCare: "bg-purple-100 text-purple-800",
  BehaviorSupport: "bg-red-100 text-red-800",
  MobilitySupport: "bg-orange-100 text-orange-800",
  DayCare: "bg-green-100 text-green-800",
  ShortStay: "bg-yellow-100 text-yellow-800",
  GroupHome: "bg-pink-100 text-pink-800",
};

const ALLOWANCE_LABELS: Record<string, string> = {
  IntensiveBehaviorSupport: "強度行動障害支援",
  EmergencySupport: "緊急時対応",
  SpecialArea: "特定地域",
  EarlyMorning: "早朝加算",
  LateNight: "深夜加算",
  DeafBlindSupport: "盲ろう者支援",
};

const UTILIZATION_STATUS_LABELS: Record<string, string> = {
  Home: "在宅",
  Facility: "入所施設",
  DayCare: "通所",
  GroupHome: "グループホーム",
};

export default function RecipientsPage() {
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [filterServiceType, setFilterServiceType] = useState<string>("");
  const [filterSupportLevel, setFilterSupportLevel] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: recipients, isLoading } = trpc.recipient.list.useQuery({
    includeDeleted,
    serviceType: filterServiceType || undefined,
    supportLevel: filterSupportLevel ? Number(filterSupportLevel) : undefined,
    utilizationStatus: filterStatus || undefined,
  });

  const { data: stats } = trpc.recipient.stats.useQuery();

  const deleteMutation = trpc.recipient.delete.useMutation({
    onSuccess: () => {
      alert("利用者を削除しました");
      utils.recipient.list.invalidate();
      utils.recipient.stats.invalidate();
    },
    onError: (error) => {
      alert(`削除に失敗しました: ${error.message}`);
    },
  });

  const handleDelete = (
    recipientId: string,
    recipientName: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        `${recipientName} さんを削除してもよろしいですか？\n\n※論理削除のため、後から復元可能です。`
      )
    ) {
      deleteMutation.mutate({ id: recipientId });
    }
  };

  const exportMutation = trpc.recipient.exportCSV.useQuery(undefined, {
    enabled: false,
  });

  const importMutation = trpc.recipient.importCSV.useMutation({
    onSuccess: (result) => {
      alert(
        `インポート成功: ${result.imported}件の利用者を登録しました` +
          (result.errors ? `\n\nエラー: ${result.errors.length}件` : "")
      );
      utils.recipient.list.invalidate();
      utils.recipient.stats.invalidate();
    },
    onError: (error) => {
      alert(`インポート失敗: ${error.message}`);
    },
  });

  const handleExport = async () => {
    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("エクスポートに失敗しました");
      console.error(error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      importMutation.mutate({ csvContent: content });
    };
    reader.readAsText(file, "UTF-8");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearFilters = () => {
    setFilterServiceType("");
    setFilterSupportLevel("");
    setFilterStatus("");
  };

  const hasActiveFilters =
    filterServiceType || filterSupportLevel || filterStatus;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">利用者管理</h1>
          <p className="text-muted-foreground">
            重度障害者支援の利用者情報を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            disabled={exportMutation.isFetching}
          >
            <Download className="mr-2 h-5 w-5" />
            CSV出力
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            <Upload className="mr-2 h-5 w-5" />
            CSV取込
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Link href="/recipients/new">
            <Button size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              新規利用者登録
            </Button>
          </Link>
        </div>
      </div>

      {/* 統計情報 */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">総利用者数</p>
                <p className="mt-1 text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="text-muted-foreground h-8 w-8" />
            </div>
          </div>
          {stats.bySupportLevel
            .sort((a, b) => (b.supportLevel ?? 0) - (a.supportLevel ?? 0))
            .slice(0, 3)
            .map((level) => (
              <div
                key={level.supportLevel}
                className="bg-card rounded-lg border p-4"
              >
                <div>
                  <p className="text-muted-foreground text-sm">
                    障害支援区分{level.supportLevel}
                  </p>
                  <p className="mt-1 text-3xl font-bold">{level._count}</p>
                  <p className="text-muted-foreground mt-1 text-xs">名</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* サービス種別クイックフィルター */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            サービス種別:
          </span>
          <button
            onClick={() => setFilterServiceType("")}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !filterServiceType
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            すべて {recipients && `(${recipients.length})`}
          </button>
          {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                setFilterServiceType(filterServiceType === key ? "" : key)
              }
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                filterServiceType === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 詳細フィルター */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            <Filter className="h-4 w-4" />
            詳細フィルター
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs">
                適用中
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-destructive hover:text-destructive/80 flex items-center gap-1 text-sm transition-colors"
            >
              <X className="h-3 w-3" />
              クリア
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-card grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                障害支援区分
              </label>
              <select
                value={filterSupportLevel}
                onChange={(e) => setFilterSupportLevel(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">すべての区分</option>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <option key={level} value={level}>
                    区分{level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">利用状況</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">すべての状況</option>
                {Object.entries(UTILIZATION_STATUS_LABELS).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  className="rounded"
                />
                削除済みを含む
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 利用者一覧 */}
      <div className="bg-card rounded-lg border">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              利用者一覧
              {recipients && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  {recipients.length}名
                </span>
              )}
            </h2>
          </div>
        </div>

        {recipients && recipients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground mb-4 text-lg">
              {hasActiveFilters
                ? "条件に一致する利用者がいません"
                : "登録されている利用者がいません"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                フィルターをクリア
              </Button>
            ) : (
              <Link href="/recipients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  最初の利用者を登録
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {recipients?.map((recipient) => (
              <Link
                key={recipient.id}
                href={`/recipients/${recipient.id}`}
                className="hover:bg-accent block p-5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {recipient.name}
                      </h3>
                      {recipient.nameKana && (
                        <span className="text-muted-foreground text-sm">
                          ({recipient.nameKana})
                        </span>
                      )}
                      {recipient.supportLevel && (
                        <span className="rounded-full border bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          区分{recipient.supportLevel}
                        </span>
                      )}
                      {recipient.deletedAt && (
                        <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs">
                          削除済み
                        </span>
                      )}
                    </div>

                    <div className="text-muted-foreground mb-2 flex flex-wrap gap-3 text-sm">
                      <span>
                        {new Date(recipient.birthDate).toLocaleDateString(
                          "ja-JP"
                        )}
                      </span>
                      <span>
                        {recipient.gender === "Male"
                          ? "男性"
                          : recipient.gender === "Female"
                            ? "女性"
                            : "その他"}
                      </span>
                      {recipient.disabilityType.length > 0 && (
                        <span>
                          {recipient.disabilityType
                            .map((t) =>
                              t === "Physical"
                                ? "身体障害"
                                : t === "Intellectual"
                                  ? "知的障害"
                                  : "精神障害"
                            )
                            .join(" / ")}
                        </span>
                      )}
                      {(recipient as any).utilizationStatus && (
                        <span>
                          {UTILIZATION_STATUS_LABELS[
                            (recipient as any).utilizationStatus
                          ] || (recipient as any).utilizationStatus}
                        </span>
                      )}
                    </div>

                    {/* サービス種別バッジ */}
                    {(recipient as any).serviceTypes &&
                      (recipient as any).serviceTypes.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {(recipient as any).serviceTypes.map(
                            (type: string) => (
                              <span
                                key={type}
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  SERVICE_TYPE_COLORS[type] ||
                                  "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {SERVICE_TYPE_LABELS[type] || type}
                              </span>
                            )
                          )}
                          {(recipient as any).behaviorSupportNeeded && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                              行動援護対象
                            </span>
                          )}
                        </div>
                      )}

                    {/* 加算バッジ */}
                    {(recipient as any).allowances &&
                      (recipient as any).allowances.length > 0 && (
                        <div className="mb-1 flex flex-wrap gap-1">
                          {(recipient as any).allowances
                            .slice(0, 3)
                            .map((allowance: string) => (
                              <span
                                key={allowance}
                                className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                              >
                                {ALLOWANCE_LABELS[allowance] || allowance}
                              </span>
                            ))}
                          {(recipient as any).allowances.length > 3 && (
                            <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                              +{(recipient as any).allowances.length - 3}件
                            </span>
                          )}
                        </div>
                      )}

                    {recipient.allergies && (
                      <div className="mt-1 text-sm">
                        <span className="text-destructive font-medium">
                          アレルギー:
                        </span>{" "}
                        <span className="text-destructive/80">
                          {recipient.allergies}
                        </span>
                      </div>
                    )}
                  </div>
                  {!recipient.deletedAt && (
                    <div className="ml-4 flex shrink-0 items-center gap-1">
                      <Link
                        href={`/recipients/${recipient.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm">
                          <Edit className="text-muted-foreground h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) =>
                          handleDelete(recipient.id, recipient.name, e)
                        }
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
