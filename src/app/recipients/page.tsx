"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  HomeHelp: "居宅介護",
  VisitingCare: "重度訪問介護",
  BehaviorSupport: "行動援護",
  DayCare: "生活介護",
  ShortStay: "短期入所",
  GroupHome: "グループホーム",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  HomeHelp: "bg-blue-100 text-blue-800",
  VisitingCare: "bg-purple-100 text-purple-800",
  BehaviorSupport: "bg-red-100 text-red-800",
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
  const router = useRouter();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterServiceType, setFilterServiceType] = useState<string>("");
  const [filterSupportLevel, setFilterSupportLevel] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [importErrors, setImportErrors] = useState<Array<string | { row?: number; name?: string; error: string }>>([]);
  const [showImportErrors, setShowImportErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: recipients, isLoading } = trpc.recipient.list.useQuery({
    includeDeleted,
    search: debouncedSearch || undefined,
    serviceType: filterServiceType || undefined,
    supportLevel: filterSupportLevel ? Number(filterSupportLevel) : undefined,
    utilizationStatus: filterStatus || undefined,
  });

  const { data: stats } = trpc.recipient.stats.useQuery();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteMutation = trpc.recipient.delete.useMutation({
    onSuccess: () => {
      showToast("利用者を削除しました", "success");
      setConfirmDeleteId(null);
      utils.recipient.list.invalidate();
      utils.recipient.stats.invalidate();
    },
    onError: (error) => {
      showToast(`削除に失敗しました: ${error.message}`, "error");
      setConfirmDeleteId(null);
    },
  });

  const handleDelete = (
    recipientId: string,
    recipientName: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(recipientId);
    setConfirmDeleteName(recipientName);
  };

  const deleteManyMutation = trpc.recipient.deleteMany.useMutation({
    onSuccess: (result) => {
      showToast(`${result.count}件の利用者を削除しました`, "success");
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
      utils.recipient.list.invalidate();
      utils.recipient.stats.invalidate();
    },
    onError: (error) => {
      showToast(`削除に失敗しました: ${error.message}`, "error");
      setConfirmBulkDelete(false);
    },
  });

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const activeRecipients =
      recipients?.filter((r) => !r.deletedAt).map((r) => r.id) ?? [];
    if (selectedIds.size === activeRecipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeRecipients));
    }
  };

  const exportMutation = trpc.recipient.exportCSV.useQuery(undefined, {
    enabled: false,
  });

  const importMutation = trpc.recipient.importCSV.useMutation({
    onSuccess: (result) => {
      const msg =
        `インポート成功: ${result.imported}件の利用者を登録しました` +
        (result.errors ? ` (エラー: ${result.errors.length}件)` : "");
      showToast(msg, result.errors && result.errors.length > 0 ? "error" : "success");

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        setShowImportErrors(true);
      }

      utils.recipient.list.invalidate();
      utils.recipient.stats.invalidate();
    },
    onError: (error) => {
      showToast(`インポート失敗: ${error.message}`, "error");
      setImportErrors([error.message]);
      setShowImportErrors(true);
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
      showToast("エクスポートに失敗しました", "error");
      console.error(error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tryRead = (encoding: string) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file, encoding);
      });

    (async () => {
      // Try UTF-8 first, fall back to Shift-JIS
      let content = await tryRead("UTF-8");
      // If first header char looks garbled (Shift-JIS read as UTF-8), retry
      if (!content.trimStart().startsWith("氏名")) {
        content = await tryRead("Shift-JIS");
      }
      // Strip BOM if present
      content = content.replace(/^\uFEFF/, "");
      // Normalize Windows line endings
      content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      importMutation.mutate({ csvContent: content });
    })();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilterServiceType("");
    setFilterSupportLevel("");
    setFilterStatus("");
  };

  const hasActiveFilters =
    searchQuery || filterServiceType || filterSupportLevel || filterStatus;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* トースト通知 */}
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

      {/* インポートエラーダイアログ */}
      {showImportErrors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-lg border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">CSVインポートエラー詳細</h3>
            <div className="mb-6 space-y-2">
              {importErrors.map((error, index) => {
                // エラーが文字列の場合
                if (typeof error === 'string') {
                  return (
                    <div key={index} className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                      {error}
                    </div>
                  );
                }
                // エラーがオブジェクトの場合
                const errorObj = error as any;
                const location = errorObj.row ? `${errorObj.row}行目` : errorObj.name ? `${errorObj.name}` : '不明';
                const message = errorObj.error || JSON.stringify(errorObj);
                return (
                  <div key={index} className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    <strong>{location}:</strong> {message}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportErrors(false);
                  setImportErrors([]);
                }}
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 一括削除確認ダイアログ */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">一括削除の確認</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              選択した {selectedIds.size} 名を削除してもよろしいですか？
              <br />
              <span className="text-xs">
                ※論理削除のため、後から復元可能です。
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmBulkDelete(false)}
                disabled={deleteManyMutation.isPending}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  deleteManyMutation.mutate({ ids: Array.from(selectedIds) })
                }
                disabled={deleteManyMutation.isPending}
              >
                {deleteManyMutation.isPending
                  ? "削除中..."
                  : `${selectedIds.size}名を削除する`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">利用者の削除</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {confirmDeleteName} さんを削除してもよろしいですか？
              <br />
              <span className="text-xs">
                ※論理削除のため、後から復元可能です。
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleteMutation.isPending}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate({ id: confirmDeleteId })}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">利用者情報</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            重度障害者支援の利用者情報を管理します
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            💡 CSV一括取込: 複数名をまとめて登録 | 新規登録: CSVから1名ずつ読み込み可能
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isFetching}
            className="sm:size-lg"
          >
            <Download className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
            {exportMutation.isFetching ? "出力中..." : "CSV出力"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="sm:size-lg"
          >
            <Upload className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
            {importMutation.isPending ? "取込中..." : "CSV一括取込"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Link href="/recipients/new">
            <Button size="sm" className="sm:size-lg">
              <UserPlus className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
              新規登録
            </Button>
          </Link>
        </div>
      </div>

      {/* 統計情報 */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilterSupportLevel("")}
            className={`bg-card hover:border-foreground rounded-lg border p-4 text-left transition-colors ${
              !filterSupportLevel ? "ring-foreground ring-2" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">総利用者数</p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">{stats.total}</p>
              </div>
              <Users className="text-muted-foreground h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </button>
          {stats.bySupportLevel
            .sort((a, b) => (b.supportLevel ?? 0) - (a.supportLevel ?? 0))
            .slice(0, 3)
            .map((level) => {
              const isActive =
                filterSupportLevel === String(level.supportLevel);
              return (
                <button
                  key={level.supportLevel}
                  onClick={() =>
                    setFilterSupportLevel(
                      isActive ? "" : String(level.supportLevel ?? "")
                    )
                  }
                  className={`bg-card hover:border-foreground rounded-lg border p-4 text-left transition-colors ${
                    isActive ? "ring-foreground ring-2" : ""
                  }`}
                >
                  <div>
                    <p className="text-muted-foreground text-sm">
                      障害支援区分{level.supportLevel}
                    </p>
                    <p className="mt-1 text-2xl font-bold sm:text-3xl">{level._count}</p>
                    <p className="text-muted-foreground mt-1 text-xs">名</p>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {/* 検索ボックス */}
      <div className="mb-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="氏名・フリガナで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border py-2 pr-4 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setDebouncedSearch(""); }}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

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
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded"
                checked={
                  selectedIds.size > 0 &&
                  selectedIds.size ===
                    (recipients?.filter((r) => !r.deletedAt).length ?? 0)
                }
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selectedIds.size > 0 &&
                      selectedIds.size <
                        (recipients?.filter((r) => !r.deletedAt).length ?? 0);
                  }
                }}
                onChange={toggleSelectAll}
              />
              <h2 className="text-lg font-semibold">
                利用者一覧
                {recipients && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    {recipients.length}名
                  </span>
                )}
              </h2>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">
                  {selectedIds.size}名を選択中
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmBulkDelete(true)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  まとめて削除
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  選択解除
                </Button>
              </div>
            )}
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
              <div key={recipient.id} className="flex items-start gap-3 p-5">
                {!recipient.deletedAt && (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded"
                    checked={selectedIds.has(recipient.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        next.has(recipient.id)
                          ? next.delete(recipient.id)
                          : next.add(recipient.id);
                        return next;
                      });
                    }}
                  />
                )}
                {recipient.deletedAt && <div className="mt-1 w-4 shrink-0" />}
                <div className="flex-1">
                  <Link
                    href={`/recipients/${recipient.id}`}
                    className="hover:bg-accent block rounded transition-colors"
                  >
                <div className="flex items-start justify-between gap-4">
                  {/* 顔写真 */}
                  {recipient.photoUrl ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-gray-200">
                      <Image
                        src={recipient.photoUrl}
                        alt={recipient.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-100">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

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
                    <div className="ml-2 flex shrink-0 items-center gap-1 sm:ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/recipients/${recipient.id}/edit`);
                        }}
                      >
                        <Edit className="text-muted-foreground h-4 w-4" />
                      </Button>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
