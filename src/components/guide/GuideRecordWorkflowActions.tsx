"use client";

import { Button } from "@/components/ui/button";
import { Send, Eye, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";

type GuideRecordStatus = "DRAFT" | "SUBMITTED";

interface GuideRecordWorkflowActionsProps {
  recordId: string;
  status: GuideRecordStatus;
  recipientId: string;
  userId: string; // 記録の作成者ID
  recipientCreatedBy?: string | null; // 利用者の作成者ID
  reviewedAt?: Date | null;
  reviewedBy?: string | null; // 将来的に「閲覧済み（担当者名）」表示用（現在は未使用）
  onSuccess?: () => void;
}

export function GuideRecordWorkflowActions({
  recordId,
  status,
  recipientId,
  recipientCreatedBy,
  reviewedAt,
  onSuccess,
}: GuideRecordWorkflowActionsProps) {
  const utils = trpc.useUtils();
  const { data: session } = useSession();

  // 閲覧済みマーク権限チェック（LEAD または MANAGER のみ）
  const canReview =
    session?.user?.role === "LEAD" || session?.user?.role === "MANAGER";

  // 提出権限チェック（STAFF: 自分が作成した利用者の記録のみ、LEAD/MANAGER: 同一ユニット内）
  const canSubmit =
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "LEAD" ||
    (session?.user?.role === "STAFF" &&
      (recipientCreatedBy === null ||
        recipientCreatedBy === session?.user?.id));

  const submitMutation = trpc.guideRecord.submit.useMutation({
    onSuccess: () => {
      utils.guideRecord.list.invalidate({ recipientId });
      utils.guideRecord.get.invalidate({ id: recordId });
      onSuccess?.();
    },
    onError: (error) => {
      alert(`提出エラー: ${error.message}`);
    },
  });

  const reviewMutation = trpc.guideRecord.review.useMutation({
    onSuccess: () => {
      utils.guideRecord.list.invalidate({ recipientId });
      utils.guideRecord.get.invalidate({ id: recordId });
      onSuccess?.();
    },
    onError: (error) => {
      alert(`閲覧済みマークエラー: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!confirm("この記録を提出しますか？")) return;
    submitMutation.mutate({ id: recordId });
  };

  const handleReview = () => {
    if (!confirm("この記録に閲覧済みマークを付けますか？")) return;
    reviewMutation.mutate({ id: recordId });
  };

  // DRAFT状態: 提出ボタン（権限がある場合のみ）
  if (status === "DRAFT") {
    if (!canSubmit) {
      return null; // 提出権限がない場合はボタンを表示しない
    }

    return (
      <Button
        onClick={handleSubmit}
        disabled={submitMutation.isPending}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Send className="mr-1 h-4 w-4" />
        {submitMutation.isPending ? "提出中..." : "提出"}
      </Button>
    );
  }

  // SUBMITTED状態: 閲覧済みマーク（LEAD/MANAGER用）
  if (status === "SUBMITTED") {
    // 閲覧済みの場合はバッジ表示
    if (reviewedAt) {
      return (
        <div className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-800">
          <CheckCircle className="h-3 w-3" />
          閲覧済み
        </div>
      );
    }

    // LEAD/MANAGER のみ閲覧済みボタンを表示
    if (!canReview) {
      return null;
    }

    return (
      <Button
        onClick={handleReview}
        disabled={reviewMutation.isPending}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        <Eye className="mr-1 h-4 w-4" />
        {reviewMutation.isPending ? "マーク中..." : "閲覧済みにする"}
      </Button>
    );
  }

  return null;
}
