import React from "react";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import { Eye, Edit3, Printer, User } from "lucide-react";

interface AccessLogSectionProps {
  recipientId: string;
}

const ACTION_LABELS: Record<string, string> = {
  View: "閲覧",
  Edit: "編集",
  Print: "印刷",
  Delete: "削除",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  View: Eye,
  Edit: Edit3,
  Print: Printer,
};

export function AccessLogSection({ recipientId }: AccessLogSectionProps) {
  const { data: session } = useSession();

  // LEAD/MANAGER権限チェック
  const hasPermission = session?.user?.role && ["LEAD", "MANAGER"].includes(session.user.role);

  const { data: logs, isLoading } = trpc.auditLog.getByResource.useQuery(
    {
      resourceType: "CareRecipient",
      resourceId: recipientId,
      limit: 10,
    },
    {
      enabled: hasPermission, // 権限がある場合のみクエリ実行
    }
  );

  // LEAD/MANAGER権限のみ表示
  if (!hasPermission) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          アクセス履歴（直近10件）
        </h3>
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          アクセス履歴（直近10件）
        </h3>
        <p className="text-muted-foreground text-sm">履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        アクセス履歴（直近10件）
      </h3>
      <div className="space-y-2">
        {logs.map((log) => {
          const Icon = ACTION_ICONS[log.action] || Eye;
          const actionLabel = ACTION_LABELS[log.action] || log.action;

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded border border-gray-100 bg-gray-50 p-2 text-xs"
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {actionLabel}
                  </span>
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="h-3 w-3" />
                  <span>{log.user?.name || "不明"}</span>
                </div>
                {log.changeNote && (
                  <div className="text-gray-600">
                    理由: {log.changeNote}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {logs.length >= 10 && (
        <div className="mt-3 text-center">
          <a
            href={`/audit-logs?resourceType=CareRecipient&resourceId=${recipientId}`}
            className="text-xs text-blue-600 hover:underline"
          >
            すべて表示
          </a>
        </div>
      )}
    </div>
  );
}
