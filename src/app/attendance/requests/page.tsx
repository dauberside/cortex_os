"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function ApprovalRequestsPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [showShiftChangeModal, setShowShiftChangeModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | undefined
  >(undefined);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Queries
  const { data: myRequests, isLoading } = trpc.approval.getMyRequests.useQuery({
    status: selectedStatus,
  });

  // Mutations
  const cancelMutation = trpc.approval.cancel.useMutation({
    onSuccess: () => {
      showToast("申請を取り下げました", "success");
      utils.approval.getMyRequests.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const handleCancel = (requestId: string) => {
    if (!confirm("この申請を取り下げますか？")) {
      return;
    }
    cancelMutation.mutate({ requestId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span>承認待ち</span>
          </div>
        );
      case "APPROVED":
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>承認済み</span>
          </div>
        );
      case "REJECTED":
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>却下</span>
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-1 text-gray-600">
            <X className="h-4 w-4" />
            <span>取り下げ</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "TIME_EDIT":
        return "打刻修正";
      case "SHIFT_CHANGE":
        return "シフト変更";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">申請・承認</h1>
        <p className="text-muted-foreground mt-2">
          打刻修正やシフト変更の申請を管理できます
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <Button onClick={() => setShowTimeEditModal(true)}>
          <Clock className="mr-2 h-4 w-4" />
          打刻修正申請
        </Button>
        <Button onClick={() => setShowShiftChangeModal(true)} variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          シフト変更申請
        </Button>
      </div>

      {/* Status filter */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <label className="mb-2 block text-sm font-medium">ステータス</label>
        <select
          value={selectedStatus || ""}
          onChange={(e) =>
            setSelectedStatus(
              e.target.value
                ? (e.target.value as any)
                : undefined
            )
          }
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
        >
          <option value="">すべて</option>
          <option value="PENDING">承認待ち</option>
          <option value="APPROVED">承認済み</option>
          <option value="REJECTED">却下</option>
          <option value="CANCELLED">取り下げ</option>
        </select>
      </div>

      {/* Requests list */}
      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">申請日時</th>
                <th className="p-3 text-left">種別</th>
                <th className="p-3 text-left">対象日</th>
                <th className="p-3 text-left">理由</th>
                <th className="p-3 text-left">ステータス</th>
                <th className="p-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {myRequests && myRequests.length > 0 ? (
                myRequests.map((request: any) => {
                  const payload = request.payload as any;
                  return (
                    <tr key={request.id} className="border-b last:border-b-0">
                      <td className="p-3">
                        {format(new Date(request.createdAt), "yyyy/MM/dd HH:mm")}
                      </td>
                      <td className="p-3">{getTypeName(request.type)}</td>
                      <td className="p-3">
                        {payload.date
                          ? format(new Date(payload.date), "yyyy/MM/dd")
                          : "-"}
                      </td>
                      <td className="p-3">
                        <div className="max-w-xs truncate" title={payload.reason}>
                          {payload.reason || "-"}
                        </div>
                      </td>
                      <td className="p-3">{getStatusBadge(request.status)}</td>
                      <td className="p-3">
                        {request.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(request.id)}
                            disabled={cancelMutation.isPending}
                          >
                            取り下げ
                          </Button>
                        )}
                        {request.status === "REJECTED" &&
                          request.rejectReason && (
                            <div className="text-sm text-red-600">
                              {request.rejectReason}
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <AlertCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground">申請がありません</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Edit Modal */}
      {showTimeEditModal && (
        <TimeEditModal
          onClose={() => setShowTimeEditModal(false)}
          onSuccess={() => {
            setShowTimeEditModal(false);
            showToast("打刻修正申請を提出しました", "success");
            utils.approval.getMyRequests.invalidate();
          }}
          onError={(message) => showToast(message, "error")}
        />
      )}

      {/* Shift Change Modal */}
      {showShiftChangeModal && (
        <ShiftChangeModal
          onClose={() => setShowShiftChangeModal(false)}
          onSuccess={() => {
            setShowShiftChangeModal(false);
            showToast("シフト変更申請を提出しました", "success");
            utils.approval.getMyRequests.invalidate();
          }}
          onError={(message) => showToast(message, "error")}
        />
      )}
    </div>
  );
}

/**
 * Time Edit Modal Component
 */
function TimeEditModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "CLOCK_IN" as "CLOCK_IN" | "CLOCK_OUT",
    time: format(new Date(), "HH:mm"),
    reason: "",
  });

  const requestMutation = trpc.approval.requestTimeEdit.useMutation({
    onSuccess,
    onError: (err) => onError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [hours, minutes] = formData.time.split(":").map(Number);
    const dateTime = new Date(formData.date);
    dateTime.setHours(hours, minutes, 0, 0);

    requestMutation.mutate({
      date: new Date(formData.date),
      type: formData.type,
      after: dateTime,
      reason: formData.reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-md rounded-lg p-6">
        <h2 className="mb-4 text-xl font-bold">打刻修正申請</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">対象日</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">種別</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "CLOCK_IN" | "CLOCK_OUT",
                  })
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="CLOCK_IN">出勤</option>
                <option value="CLOCK_OUT">退勤</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">時刻</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">理由</label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder="打刻修正が必要な理由を入力してください"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={requestMutation.isPending}
            >
              申請する
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={requestMutation.isPending}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Shift Change Modal Component
 */
function ShiftChangeModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    reason: "",
  });

  const requestMutation = trpc.approval.requestShiftChange.useMutation({
    onSuccess,
    onError: (err) => onError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetDate = new Date(formData.date);

    const [startHours, startMinutes] = formData.startTime.split(":").map(Number);
    const startAt = new Date(targetDate);
    startAt.setHours(startHours, startMinutes, 0, 0);

    const [endHours, endMinutes] = formData.endTime.split(":").map(Number);
    const endAt = new Date(targetDate);
    endAt.setHours(endHours, endMinutes, 0, 0);

    // If end time is earlier than start time, assume next day
    if (endAt < startAt) {
      endAt.setDate(endAt.getDate() + 1);
    }

    requestMutation.mutate({
      date: targetDate,
      startAt,
      endAt,
      breakMinutes: formData.breakMinutes,
      reason: formData.reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-md rounded-lg p-6">
        <h2 className="mb-4 text-xl font-bold">シフト変更申請</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">対象日</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">開始</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">終了</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                休憩時間（分）
              </label>
              <input
                type="number"
                value={formData.breakMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    breakMinutes: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full rounded-md border px-3 py-2"
                min="0"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">理由</label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder="シフト変更が必要な理由を入力してください"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={requestMutation.isPending}
            >
              申請する
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={requestMutation.isPending}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
