"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowLeft,
  MapPin,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { GuideRecordStatusBadge } from "@/components/guide/GuideRecordStatusBadge";
import { GuideRecordWorkflowActions } from "@/components/guide/GuideRecordWorkflowActions";
import { useSession } from "next-auth/react";

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return "終了未記録";
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

export default function GuideRecordListPage() {
  const params = useParams();
  const recipientId = params.id as string;
  const { data: session } = useSession();

  const utils = trpc.useUtils();
  const { data: recipient } = trpc.recipient.get.useQuery({ id: recipientId });
  const { data: records, isLoading } = trpc.guideRecord.list.useQuery({
    recipientId,
    limit: 50,
  });
  const deleteMutation = trpc.guideRecord.delete.useMutation({
    onSuccess: () => utils.guideRecord.list.invalidate({ recipientId }),
  });

  const handleDelete = (id: string) => {
    if (!confirm("このガイド記録を削除しますか？")) return;
    deleteMutation.mutate({ id });
  };

  // 編集・削除権限チェック
  const canEditDelete = (record: any) => {
    const userRole = session?.user?.role;
    const currentUserId = session?.user?.id;

    // MANAGERは全記録編集・削除可能
    if (userRole === "MANAGER")
      return { canEdit: true, canDelete: true, reason: null };

    // LEADは同一ユニット内の記録編集・削除可能（提出済みも可）
    if (userRole === "LEAD")
      return { canEdit: true, canDelete: true, reason: null };

    // STAFF: 自分が作成した利用者のDRAFT記録のみ編集・削除可能
    if (userRole === "STAFF") {
      // 提出済み記録は編集・削除不可
      if (record.status === "SUBMITTED") {
        return {
          canEdit: false,
          canDelete: false,
          reason: "提出済みの記録は編集・削除できません",
        };
      }

      // 利用者の作成者チェック（createdByがnullまたは自分が作成した利用者の場合のみ編集可能）
      if (
        recipient?.createdBy !== null &&
        recipient?.createdBy !== currentUserId
      ) {
        return {
          canEdit: false,
          canDelete: false,
          reason: "この利用者の記録を編集・削除する権限がありません",
        };
      }

      // DRAFT記録は編集・削除可能
      return { canEdit: true, canDelete: true, reason: null };
    }

    return { canEdit: false, canDelete: false, reason: "権限がありません" };
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
      <Link href={`/recipients/${recipientId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者詳細に戻る
        </Button>
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">
            ガイド記録
          </h1>
          {recipient && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {recipient.name} さんの行動援護・移動支援記録
            </p>
          )}
        </div>
        <Link href={`/recipients/${recipientId}/guide/new`}>
          <Button size="sm" className="sm:size-lg w-full sm:w-auto">
            <Plus className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
            ガイド記録登録
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-lg border">
        {records && records.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground mb-4 text-lg">
              ガイド記録がまだありません
            </p>
            <Link href={`/recipients/${recipientId}/guide/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                最初のガイド記録を登録
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {records?.map((record) => (
              <div
                key={record.id}
                className="hover:bg-accent p-6 transition-colors"
              >
                {/* ヘッダー行 */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-base font-semibold sm:text-lg">
                        {new Date(record.startedAt).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <GuideRecordStatusBadge status={record.status} />
                    </div>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      <p>利用者: {recipient?.name || "不明"}</p>
                      <p>
                        支援時間:{" "}
                        {formatDuration(
                          new Date(record.startedAt),
                          record.endedAt ? new Date(record.endedAt) : null
                        )}
                        　|　記録者: {record.user.name || "不明"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/recipients/${recipientId}/guide/${record.id}`}
                    >
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-3 w-3" />
                        詳細
                      </Button>
                    </Link>
                    <GuideRecordWorkflowActions
                      recordId={record.id}
                      status={record.status}
                      recipientId={recipientId}
                      userId={record.userId}
                      recipientCreatedBy={recipient?.createdBy}
                      reviewedAt={record.reviewedAt}
                      reviewedBy={record.reviewedBy}
                    />
                    {(() => {
                      const permissions = canEditDelete(record);

                      if (!permissions.canEdit) {
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title={permissions.reason || "編集できません"}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            編集できません
                          </Button>
                        );
                      }

                      return (
                        <Link
                          href={`/recipients/${recipientId}/guide/${record.id}/edit`}
                        >
                          <Button variant="outline" size="sm">
                            <Pencil className="mr-1 h-3 w-3" />
                            編集
                          </Button>
                        </Link>
                      );
                    })()}

                    {(() => {
                      const permissions = canEditDelete(record);

                      if (!permissions.canDelete) {
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title={permissions.reason || "削除できません"}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            削除できません
                          </Button>
                        );
                      }

                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          削除
                        </Button>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* 外出情報 */}
                  <div className="space-y-1 text-sm">
                    <p className="mb-1 text-xs font-semibold text-blue-600">
                      外出情報
                    </p>
                    {record.destination && (
                      <p>
                        <span className="font-medium">外出先:</span>{" "}
                        {record.destination}
                      </p>
                    )}
                    {record.purpose && (
                      <p>
                        <span className="font-medium">目的:</span>{" "}
                        {record.purpose}
                      </p>
                    )}
                    {record.transport.length > 0 && (
                      <p>
                        <span className="font-medium">移動手段:</span>{" "}
                        {record.transport.join("・")}
                      </p>
                    )}
                  </div>

                  {/* 金銭管理 */}
                  {record.cashHandled && (
                    <div className="space-y-1 text-sm">
                      <p className="mb-1 text-xs font-semibold text-orange-600">
                        金銭管理
                      </p>
                      {record.handedAmount != null && (
                        <p>
                          <span className="font-medium">渡した金額:</span>{" "}
                          {record.handedAmount.toLocaleString()}円
                        </p>
                      )}
                      {record.handedAmount != null &&
                        record.returnedAmount != null && (
                          <p>
                            <span className="font-medium">使用合計:</span>{" "}
                            <span className="font-semibold text-orange-700">
                              {(
                                record.handedAmount - record.returnedAmount
                              ).toLocaleString()}
                              円
                            </span>
                          </p>
                        )}
                      {record.returnedAmount != null && (
                        <p>
                          <span className="font-medium">残金:</span>{" "}
                          {record.returnedAmount.toLocaleString()}円
                        </p>
                      )}
                      {record.cashNote && (
                        <p className="text-muted-foreground text-xs">
                          {record.cashNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 支援内容・利用者の様子 */}
                {(record.supportContent || record.userCondition) && (
                  <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                    {record.supportContent && (
                      <p>
                        <span className="font-medium">支援内容:</span>{" "}
                        {record.supportContent}
                      </p>
                    )}
                    {record.userCondition && (
                      <p>
                        <span className="font-medium">利用者の様子:</span>{" "}
                        {record.userCondition}
                      </p>
                    )}
                  </div>
                )}

                {record.notes && (
                  <div className="mt-3 border-t pt-3 text-sm">
                    <p>
                      <span className="font-medium">特記事項:</span>{" "}
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
