"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Download,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

export default function MonthlyClosingPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"closing" | "history" | "csv">(
    "closing"
  );
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedClosingId, setSelectedClosingId] = useState<string>("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Queries
  const { data: units } = trpc.unit.list.useQuery();

  const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const { data: closingStatus } = trpc.monthlyClosing.getStatus.useQuery(
    {
      unitId: selectedUnitId,
      yearMonth,
    },
    {
      enabled: !!selectedUnitId,
    }
  );

  const { data: summary } = trpc.monthlyClosing.getSummary.useQuery(
    {
      unitId: selectedUnitId,
      yearMonth,
    },
    {
      enabled: !!selectedUnitId,
    }
  );

  const { data: history } = trpc.monthlyClosing.list.useQuery(
    {
      unitId: selectedUnitId || undefined,
      limit: 50,
    },
    {
      enabled: activeTab === "history",
    }
  );

  // Mutations
  const closeMutation = trpc.monthlyClosing.close.useMutation({
    onSuccess: () => {
      showToast("月次締めを実行しました", "success");
      utils.monthlyClosing.getStatus.invalidate();
      utils.monthlyClosing.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const reopenMutation = trpc.monthlyClosing.reopen.useMutation({
    onSuccess: () => {
      showToast("差戻しを実行しました", "success");
      utils.monthlyClosing.getStatus.invalidate();
      utils.monthlyClosing.list.invalidate();
      setShowReopenModal(false);
      setReopenReason("");
      setSelectedClosingId("");
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleClose = () => {
    if (
      !confirm(
        `${currentYear}年${currentMonth}月を締めますか？\n\n締め後は該当月のデータを変更できなくなります。`
      )
    ) {
      return;
    }

    closeMutation.mutate({
      unitId: selectedUnitId,
      yearMonth,
    });
  };

  const handleReopenClick = (closingId: string) => {
    setSelectedClosingId(closingId);
    setShowReopenModal(true);
  };

  const handleReopenSubmit = () => {
    if (!reopenReason.trim()) {
      showToast("差戻し理由を入力してください", "error");
      return;
    }

    reopenMutation.mutate({
      closingId: selectedClosingId,
      reason: reopenReason,
    });
  };

  const handleDownloadCSV = () => {
    if (!selectedUnitId) {
      showToast("事業所を選択してください", "error");
      return;
    }

    // CSV download via tRPC query
    const params = new URLSearchParams({
      input: JSON.stringify({
        json: {
          unitId: selectedUnitId,
          yearMonth,
        },
      }),
    });
    window.open(
      `/api/trpc/monthlyClosing.exportCSV?${params.toString()}`,
      "_blank"
    );
  };

  // Auto-select first available unit
  const isManager = session?.user?.role === "MANAGER";
  const isLead = session?.user?.role === "LEAD";
  const canManage = isManager;

  const availableUnits = units?.filter((u: any) => {
    if (isManager) return true;
    if (isLead) {
      return u.staffs?.some((us: any) => us.userId === session?.user?.id);
    }
    return false;
  });

  useEffect(() => {
    if (availableUnits && availableUnits.length > 0 && !selectedUnitId) {
      setSelectedUnitId(availableUnits[0].id);
    }
  }, [availableUnits, selectedUnitId]);

  const isClosed = closingStatus?.isClosed === true;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-6 py-4 text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">月次締め管理</h1>
        <p className="text-muted-foreground mt-2">
          月次締め・差戻し・CSV出力を管理します
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("closing")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "closing"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            月次締め
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "history"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            差戻し履歴
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "csv"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            CSV出力
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Unit selector */}
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">事業所</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              {availableUnits?.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.serviceType})
                </option>
              ))}
            </select>
          </div>

          {/* Month navigation */}
          {activeTab !== "history" && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">
                  {currentYear}年 {currentMonth}月
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "closing" && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">締め状態</h2>
                <p className="text-muted-foreground text-sm">
                  {currentYear}年{currentMonth}月の締め状態
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isClosed ? (
                  <>
                    <Lock className="h-5 w-5 text-red-600" />
                    <span className="text-lg font-bold text-red-600">
                      締め済み
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      未締め
                    </span>
                  </>
                )}
              </div>
            </div>

            {closingStatus && isClosed && closingStatus.closing && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
                <div>
                  締め日時:{" "}
                  {new Date(closingStatus.closing.closedAt).toLocaleString("ja-JP")}
                </div>
                <div>
                  締め実行者: {closingStatus.closing.closedByUser?.name || "不明"}
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          {summary && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="mb-4 text-lg font-semibold">集計プレビュー</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    対象職員数
                  </div>
                  <div className="text-2xl font-bold">{summary.totalStaff}人</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    総出勤日数
                  </div>
                  <div className="text-2xl font-bold">{summary.totalRecords}日</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    総実働時間
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.floor(summary.totalWorkMinutes / 60)}時間
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    深夜時間
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.floor(summary.totalMidnightMinutes / 60)}時間
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {canManage && selectedUnitId && (
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">締め操作</h2>
                  <p className="text-muted-foreground text-sm">
                    {isClosed
                      ? "締め済みです。差戻しは「差戻し履歴」タブから実行してください。"
                      : "締めを実行すると、該当月のデータを変更できなくなります。"}
                  </p>
                </div>
                {!isClosed && (
                  <Button
                    onClick={handleClose}
                    disabled={closeMutation.isPending}
                    size="lg"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    月次締めを実行
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">対象月</th>
                  <th className="p-3 text-left">事業所</th>
                  <th className="p-3 text-left">締め日時</th>
                  <th className="p-3 text-left">締め実行者</th>
                  <th className="p-3 text-left">状態</th>
                  {canManage && <th className="p-3 text-center">操作</th>}
                </tr>
              </thead>
              <tbody>
                {history && history.length > 0 ? (
                  history.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="p-3">
                        {item.year}年{item.month}月
                      </td>
                      <td className="p-3">{item.unit?.name || "不明"}</td>
                      <td className="p-3">
                        {new Date(item.closedAt).toLocaleString("ja-JP")}
                      </td>
                      <td className="p-3">
                        {item.closedByUser?.name || "不明"}
                      </td>
                      <td className="p-3">
                        {item.reopenedAt ? (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">差戻し済み</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">締め済み</span>
                          </div>
                        )}
                      </td>
                      {canManage && (
                        <td className="p-3 text-center">
                          {!item.reopenedAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReopenClick(item.id)}
                            >
                              <RotateCcw className="mr-2 h-3 w-3" />
                              差戻し
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={canManage ? 6 : 5}
                      className="p-12 text-center"
                    >
                      <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground">
                        締め履歴がありません
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "csv" && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">CSV出力</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            選択した月・事業所の勤怠データをCSV形式でダウンロードします
          </p>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-4">
              <div className="text-sm font-medium">出力対象</div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div>
                  対象月: {currentYear}年{currentMonth}月
                </div>
                <div>
                  事業所:{" "}
                  {availableUnits?.find((u: any) => u.id === selectedUnitId)
                    ?.name || "未選択"}
                </div>
              </div>
            </div>

            <Button
              onClick={handleDownloadCSV}
              disabled={!selectedUnitId}
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              CSVダウンロード
            </Button>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold">月次締め差戻し</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              差戻しを実行すると、該当月のデータを再度編集できるようになります。
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                差戻し理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
                placeholder="例: 打刻漏れが発見されたため"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleReopenSubmit}
                disabled={reopenMutation.isPending || !reopenReason.trim()}
              >
                差戻しを実行
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenReason("");
                  setSelectedClosingId("");
                }}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
