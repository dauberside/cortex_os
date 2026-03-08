"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, FileText, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AuditLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const { data: log, isLoading, error } = trpc.auditLog.get.useQuery({
    id: logId,
  });

  const getActionLabel = (action: string) => {
    switch (action) {
      case "View":
        return "閲覧";
      case "Edit":
        return "編集";
      case "Delete":
        return "削除";
      case "Approve":
        return "承認";
      case "BackToDraft":
        return "下書きに戻す";
      case "Submit":
        return "提出";
      default:
        return action;
    }
  };

  const getResourceTypeLabel = (resourceType: string) => {
    switch (resourceType) {
      case "CareRecipient":
        return "利用者";
      case "GuideRecord":
        return "ガイド記録";
      case "Assessment":
        return "アセスメント";
      case "ServiceRecord":
        return "サービス実績";
      case "DailyLog":
        return "業務日誌";
      default:
        return resourceType;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "STAFF":
        return "スタッフ";
      case "LEAD":
        return "リーダー";
      case "MANAGER":
        return "管理者";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-lg">監査ログが見つかりません</div>
        {error && (
          <p className="text-destructive text-sm">{error.message}</p>
        )}
        <Link href="/audit-logs">
          <Button>監査ログ一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const isPostSubmissionEdit =
    log.action === "Edit" && log.metadata?.beforeStatus === "SUBMITTED";

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/audit-logs">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          監査ログ一覧に戻る
        </Button>
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="mb-2 text-3xl font-bold">監査ログ 詳細</h1>
          {isPostSubmissionEdit && (
            <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              提出後に修正
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          {new Date(log.createdAt).toLocaleString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      </div>

      <div className="grid gap-6">
        {/* ユーザー情報 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <User className="h-5 w-5" />
            実行ユーザー
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">名前</p>
              <p className="font-medium">{log.user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">メール</p>
              <p className="font-medium">{log.user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">権限</p>
              <p className="font-medium">{getRoleLabel(log.user.role)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">ユーザーID</p>
              <p className="font-mono text-xs">{log.user.id}</p>
            </div>
          </div>
        </div>

        {/* 操作情報 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <FileText className="h-5 w-5" />
            操作情報
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">操作</p>
              <span
                className={`inline-flex items-center gap-1 rounded px-3 py-1 text-sm font-medium ${
                  log.action === "Delete"
                    ? "bg-red-100 text-red-800"
                    : log.action === "Edit"
                      ? "bg-yellow-100 text-yellow-800"
                      : log.action === "View"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {getActionLabel(log.action)}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                リソース種別
              </p>
              <p className="font-medium">
                {getResourceTypeLabel(log.resourceType)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">リソースID</p>
              <p className="font-mono text-xs">{log.resourceId}</p>
            </div>
            {log.path && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm">パス</p>
                <p className="text-sm">{log.path}</p>
              </div>
            )}
          </div>
        </div>

        {/* 時刻情報 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Clock className="h-5 w-5" />
            時刻情報
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">実行日時</p>
              <p className="font-medium">
                {new Date(log.createdAt).toLocaleString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                タイムスタンプ
              </p>
              <p className="font-mono text-xs">
                {new Date(log.createdAt).toISOString()}
              </p>
            </div>
          </div>
        </div>

        {/* 変更理由 */}
        {log.changeNote && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">変更理由</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="whitespace-pre-wrap">{log.changeNote}</p>
            </div>
          </div>
        )}

        {/* メタデータ */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">メタデータ</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="overflow-x-auto text-sm">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>

            {/* 提出後の修正警告 */}
            {isPostSubmissionEdit && (
              <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">
                      提出後に修正
                    </p>
                    <p className="mt-1 text-sm text-orange-700">
                      この操作は、提出済み（SUBMITTED）の記録を修正したものです。変更内容を慎重に確認してください。
                    </p>
                    {log.metadata.beforeStatus && log.metadata.afterStatus && (
                      <p className="mt-2 text-sm text-orange-700">
                        ステータス変更: {log.metadata.beforeStatus} →{" "}
                        {log.metadata.afterStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 関連リソースへのリンク */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">関連リソース</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">種別:</span>{" "}
              {getResourceTypeLabel(log.resourceType)}
            </p>
            <p className="font-mono text-sm">
              <span className="text-muted-foreground">ID:</span>{" "}
              {log.resourceId}
            </p>
            {log.path && (
              <p className="text-sm">
                <span className="text-muted-foreground">パス:</span> {log.path}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
