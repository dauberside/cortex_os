"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Users,
  UserPlus,
  Trash2,
  Plus,
  Settings,
} from "lucide-react";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GH: "グループホーム",
  KAIGO: "居宅介護",
  JUSHO: "重度訪問介護",
  SHORT: "ショートステイ",
};

const SHIFT_LABELS: Record<string, string> = {
  Day: "日勤",
  Late: "遅番",
  Night: "夜勤",
};

export default function UnitDetailPage() {
  const params = useParams();
  const unitId = params.id as string;
  const utils = trpc.useUtils();

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [staffRole, setStaffRole] = useState<"primary" | "temporary">(
    "primary"
  );
  const [assignedDate, setAssignedDate] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { data: unit, isLoading } = trpc.unit.get.useQuery({ id: unitId });
  const { data: allUsers } = trpc.unit.listUsers.useQuery();
  const { data: allRecipients } = trpc.recipient.list.useQuery({
    includeDeleted: false,
  });
  const { data: recentLogs } = trpc.dailyLog.list.useQuery({
    unitId,
    limit: 5,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addStaffMutation = trpc.unit.addStaff.useMutation({
    onSuccess: () => {
      showToast("職員を追加しました", "success");
      setShowAddStaff(false);
      setSelectedUserId("");
      utils.unit.get.invalidate({ id: unitId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const removeStaffMutation = trpc.unit.removeStaff.useMutation({
    onSuccess: () => {
      showToast("職員を削除しました", "success");
      utils.unit.get.invalidate({ id: unitId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const addRecipientMutation = trpc.unit.addRecipient.useMutation({
    onSuccess: () => {
      showToast("利用者を追加しました", "success");
      setShowAddRecipient(false);
      setSelectedRecipientId("");
      utils.unit.get.invalidate({ id: unitId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const removeRecipientMutation = trpc.unit.removeRecipient.useMutation({
    onSuccess: () => {
      showToast("利用者を退所登録しました", "success");
      utils.unit.get.invalidate({ id: unitId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!unit) return <div className="p-8">ユニットが見つかりません</div>;

  const existingStaffIds = new Set(unit.staffs.map((s) => s.userId));
  const existingRecipientIds = new Set(
    unit.recipients.map((r) => r.recipientId)
  );
  const availableUsers =
    allUsers?.filter((u) => !existingStaffIds.has(u.id)) ?? [];
  const availableRecipients =
    allRecipients?.filter((r) => !existingRecipientIds.has(r.id)) ?? [];

  const primaryStaffs = unit.staffs.filter((s) => s.role === "primary");
  const temporaryStaffs = unit.staffs.filter((s) => s.role === "temporary");

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

      <div className="mb-6">
        <Link
          href="/units"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          ユニット一覧に戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="mb-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{unit.name}</h1>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            {SERVICE_TYPE_LABELS[unit.serviceType] || unit.serviceType}
          </span>
        </div>
        {unit.description && (
          <p className="text-muted-foreground mb-3 text-sm">
            {unit.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={`/units/${unitId}/log/new`}>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              業務日誌を作成
            </Button>
          </Link>
          <Link href={`/units/${unitId}/log`}>
            <Button size="sm" variant="outline">
              <BookOpen className="mr-1.5 h-4 w-4" />
              日誌一覧
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 職員管理 */}
        <div className="bg-card rounded-lg border">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                職員
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddStaff(!showAddStaff)}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                所属職員を登録
              </Button>
            </div>
          </div>

          {showAddStaff && (
            <div className="border-b bg-gray-50 p-4">
              <div className="space-y-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">職員を選択...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
                <select
                  value={staffRole}
                  onChange={(e) =>
                    setStaffRole(e.target.value as "primary" | "temporary")
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="primary">固定担当</option>
                  <option value="temporary">臨時</option>
                </select>
                {staffRole === "temporary" && (
                  <input
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!selectedUserId || addStaffMutation.isPending}
                    onClick={() =>
                      addStaffMutation.mutate({
                        unitId,
                        userId: selectedUserId,
                        role: staffRole,
                        assignedDate:
                          staffRole === "temporary" && assignedDate
                            ? new Date(assignedDate)
                            : undefined,
                      })
                    }
                  >
                    追加する
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddStaff(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y">
            {primaryStaffs.length === 0 && temporaryStaffs.length === 0 ? (
              <p className="text-muted-foreground p-4 text-sm">
                職員が登録されていません
              </p>
            ) : (
              <>
                {primaryStaffs.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {s.user.name || s.user.email}
                      </p>
                      <span className="text-muted-foreground text-xs">
                        固定担当
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStaffMutation.mutate({ id: s.id })}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {temporaryStaffs.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {s.user.name || s.user.email}
                      </p>
                      <span className="text-muted-foreground text-xs">
                        臨時
                        {s.assignedDate &&
                          ` (${new Date(s.assignedDate).toLocaleDateString("ja-JP")})`}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStaffMutation.mutate({ id: s.id })}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 利用者情報 */}
        <div className="bg-card rounded-lg border">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                利用者
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddRecipient(!showAddRecipient)}
              >
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
            </div>
          </div>

          {showAddRecipient && (
            <div className="border-b bg-gray-50 p-4">
              <div className="space-y-3">
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">利用者を選択...</option>
                  {availableRecipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={
                      !selectedRecipientId || addRecipientMutation.isPending
                    }
                    onClick={() =>
                      addRecipientMutation.mutate({
                        unitId,
                        recipientId: selectedRecipientId,
                      })
                    }
                  >
                    追加する
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddRecipient(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y">
            {unit.recipients.length === 0 ? (
              <p className="text-muted-foreground p-4 text-sm">
                利用者が登録されていません
              </p>
            ) : (
              unit.recipients.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium">{r.recipient.name}</p>
                    {r.recipient.nameKana && (
                      <p className="text-muted-foreground text-xs">
                        {r.recipient.nameKana}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      入所: {new Date(r.joinedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/recipients/${r.recipient.id}`}>
                      <Button size="sm" variant="ghost">
                        <Settings className="text-muted-foreground h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        removeRecipientMutation.mutate({ id: r.id })
                      }
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 最近の業務日誌 */}
      <div className="bg-card mt-6 rounded-lg border">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5" />
              最近の業務日誌
            </h2>
            <Link href={`/units/${unitId}/log`}>
              <Button size="sm" variant="outline">
                すべて見る
              </Button>
            </Link>
          </div>
        </div>
        <div className="divide-y">
          {!recentLogs?.items.length ? (
            <p className="text-muted-foreground p-4 text-sm">
              業務日誌がまだありません
            </p>
          ) : (
            recentLogs.items.map((log) => (
              <Link key={log.id} href={`/units/${unitId}/log/${log.id}`}>
                <div className="hover:bg-accent flex items-center justify-between p-4 transition-colors">
                  <div>
                    <p className="font-medium">
                      {new Date(log.logDate).toLocaleDateString("ja-JP")}
                      <span className="text-muted-foreground ml-2 text-sm">
                        {SHIFT_LABELS[log.shift] || log.shift}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      担当: {log.staff.name || log.staff.email} · 記録:{" "}
                      {log._count.entries}名
                      {log.majorEvent && (
                        <span className="text-destructive ml-2 font-medium">
                          ⚠ 重大イベントあり
                        </span>
                      )}
                    </p>
                  </div>
                  <ArrowLeft className="text-muted-foreground h-4 w-4 rotate-180" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
