"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [selectedType, setSelectedType] = useState<
    "TIME_EDIT" | "SHIFT_CHANGE" | undefined
  >(undefined);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isStaff = session?.user?.role === "STAFF";

  // Queries
  const { data: pendingRequests, isLoading } =
    trpc.approval.getPendingRequests.useQuery(
      {
        type: selectedType,
      },
      {
        enabled: !isStaff,
      }
    );

  // Mutations
  const approveMutation = trpc.approval.approve.useMutation({
    onSuccess: () => {
      showToast("申請を承認しました", "success");
      utils.approval.getPendingRequests.invalidate();
      setShowApproveModal(false);
      setSelectedRequest(null);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const rejectMutation = trpc.approval.reject.useMutation({
    onSuccess: () => {
      showToast("申請を却下しました", "success");
      utils.approval.getPendingRequests.invalidate();
      setShowRejectModal(false);
      setSelectedRequest(null);
    },
    onError: (err) => showToast(err.message, "error"),
  });

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

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  if (isStaff) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg border p-12 text-center">
          <AlertCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            承認機能はLEAD/MANAGERのみ利用できます
          </p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">承認管理</h1>
        <p className="text-muted-foreground mt-2">
          スタッフからの申請を確認・承認できます
        </p>
      </div>

      {/* Type filter */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <label className="mb-2 block text-sm font-medium">申請種別</label>
        <select
          value={selectedType || ""}
          onChange={(e) =>
            setSelectedType(e.target.value ? (e.target.value as any) : undefined)
          }
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
        >
          <option value="">すべて</option>
          <option value="TIME_EDIT">打刻修正</option>
          <option value="SHIFT_CHANGE">シフト変更</option>
        </select>
      </div>

      {/* Requests list */}
      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">申請日時</th>
                <th className="p-3 text-left">申請者</th>
                <th className="p-3 text-left">種別</th>
                <th className="p-3 text-left">詳細</th>
                <th className="p-3 text-left">理由</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests && pendingRequests.length > 0 ? (
                pendingRequests.map((request: any) => {
                  const payload = request.payload as any;
                  return (
                    <tr key={request.id} className="border-b last:border-b-0">
                      <td className="p-3">
                        {format(new Date(request.createdAt), "MM/dd HH:mm")}
                      </td>
                      <td className="p-3">
                        {request.requester?.name || request.requester?.email}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {request.type === "TIME_EDIT" ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                          {getTypeName(request.type)}
                        </div>
                      </td>
                      <td className="p-3">
                        {request.type === "TIME_EDIT" ? (
                          <div className="text-sm">
                            <div>
                              {format(new Date(payload.date), "yyyy/MM/dd")}
                            </div>
                            <div>
                              {payload.type === "CLOCK_IN" ? "出勤" : "退勤"}:{" "}
                              {payload.before
                                ? format(new Date(payload.before), "HH:mm")
                                : "未打刻"}{" "}
                              → {format(new Date(payload.after), "HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div>
                              {format(new Date(payload.date), "yyyy/MM/dd")}
                            </div>
                            {payload.startAt && payload.endAt && (
                              <div>
                                {format(new Date(payload.startAt), "HH:mm")} -{" "}
                                {format(new Date(payload.endAt), "HH:mm")}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div
                          className="max-w-xs truncate text-sm"
                          title={payload.reason}
                        >
                          {payload.reason || "-"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            却下
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <CheckCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground">
                      承認待ちの申請はありません
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <ApproveModal
          request={selectedRequest}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={(notes) => {
            approveMutation.mutate({
              requestId: selectedRequest.id,
              notes,
            });
          }}
          isPending={approveMutation.isPending}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <RejectModal
          request={selectedRequest}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={(reason) => {
            rejectMutation.mutate({
              requestId: selectedRequest.id,
              reason,
            });
          }}
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  );
}

/**
 * Approve Modal Component
 */
function ApproveModal({
  request,
  onClose,
  onConfirm,
  isPending,
}: {
  request: any;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState("");
  const payload = request.payload as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-md rounded-lg p-6">
        <h2 className="mb-4 text-xl font-bold">申請を承認</h2>

        <div className="mb-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">申請者: </span>
            {request.requester?.name || request.requester?.email}
          </div>
          <div>
            <span className="text-muted-foreground">種別: </span>
            {request.type === "TIME_EDIT" ? "打刻修正" : "シフト変更"}
          </div>
          <div>
            <span className="text-muted-foreground">理由: </span>
            {payload.reason}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            承認メモ（任意）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="承認に関するメモがあれば入力してください"
          />
        </div>

        <div className="flex gap-4">
          <Button
            className="flex-1"
            onClick={() => onConfirm(notes || undefined)}
            disabled={isPending}
          >
            承認する
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reject Modal Component
 */
function RejectModal({
  request,
  onClose,
  onConfirm,
  isPending,
}: {
  request: any;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const payload = request.payload as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-md rounded-lg p-6">
        <h2 className="mb-4 text-xl font-bold">申請を却下</h2>

        <div className="mb-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">申請者: </span>
            {request.requester?.name || request.requester?.email}
          </div>
          <div>
            <span className="text-muted-foreground">種別: </span>
            {request.type === "TIME_EDIT" ? "打刻修正" : "シフト変更"}
          </div>
          <div>
            <span className="text-muted-foreground">理由: </span>
            {payload.reason}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            却下理由 <span className="text-red-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="却下する理由を入力してください"
            required
          />
        </div>

        <div className="flex gap-4">
          <Button
            className="flex-1"
            onClick={() => onConfirm(reason)}
            disabled={isPending || !reason.trim()}
          >
            却下する
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}
