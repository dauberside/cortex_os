"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FileText, Filter, ChevronDown, ChevronUp, AlertTriangle, Trash2, Clock } from "lucide-react";
import Link from "next/link";

export default function AuditLogsPage() {
  const [selectedDays, setSelectedDays] = useState(30); // デフォルト30日
  const [selectedResourceType, setSelectedResourceType] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [postSubmissionEditOnly, setPostSubmissionEditOnly] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const limit = 50;

  // 監査ログ一覧取得
  const { data, isLoading } = trpc.auditLog.list.useQuery({
    resourceType: selectedResourceType || undefined,
    action: selectedAction || undefined,
    userId: selectedUserId || undefined,
    days: selectedDays,
    limit,
    offset,
  });

  // ユニット一覧取得（名前変換用）
  const { data: units } = trpc.unit.list.useQuery();

  // 利用者一覧取得（名前変換用）
  const { data: recipients } = trpc.recipient.list.useQuery({});

  const getActionLabel = (action: string) => {
    switch (action) {
      case "View":
        return "閲覧";
      case "Create":
        return "作成";
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
      case "SupportProfileSheet":
        return "サポート基本情報票";
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

  // リソース名を取得（IDから名前に変換）
  const getResourceName = (resourceType: string, resourceId: string, metadata?: any) => {
    if (resourceType === "CareRecipient") {
      const recipient = recipients?.find((r: any) => r.id === resourceId);
      return recipient ? recipient.name : null;
    }
    if (resourceType === "DailyLog") {
      // メタデータからユニットIDを取得
      if (metadata?.unitId) {
        const unit = units?.find((u: any) => u.id === metadata.unitId);
        return unit ? unit.name : null;
      }
    }
    if (resourceType === "Assessment" || resourceType === "GuideRecord" || resourceType === "SupportProfileSheet") {
      // メタデータにrecipientNameがあればそれを優先
      if (metadata?.recipientName) {
        return metadata.recipientName;
      }
      // なければrecipientIdから取得
      if (metadata?.recipientId) {
        const recipient = recipients?.find((r: any) => r.id === metadata.recipientId);
        return recipient ? recipient.name : null;
      }
    }
    // 他のリソースタイプも必要に応じて追加可能
    return null;
  };

  // メタデータを人間の言葉で要約
  const summarizeMetadata = (metadata: any, resourceType: string) => {
    if (!metadata || typeof metadata !== "object") return null;

    const parts: string[] = [];

    // DailyLog（業務日誌）の場合
    if (resourceType === "DailyLog") {
      if (metadata.shift) {
        const shiftLabel = metadata.shift === "Day" ? "日勤" : metadata.shift === "Late" ? "遅番" : metadata.shift === "Night" ? "夜勤" : metadata.shift;
        parts.push(`勤務: ${shiftLabel}`);
      }
      if (metadata.unitId) {
        // ユニットIDから名前を取得
        const unit = units?.find((u: any) => u.id === metadata.unitId);
        const unitName = unit ? unit.name : metadata.unitId;
        parts.push(`ユニット: ${unitName}`);
      }
      if (metadata.majorEvent !== undefined) {
        parts.push(`重大イベント: ${metadata.majorEvent ? "あり" : "なし"}`);
      }
    }

    // 更新されたフィールド
    if (metadata.updatedFields && Array.isArray(metadata.updatedFields)) {
      if (metadata.updatedFields.length > 0) {
        parts.push(`更新項目: ${metadata.updatedFields.length}件`);
      }
    }

    // 提出後修正の警告
    if (metadata.beforeStatus === "SUBMITTED") {
      parts.push("⚠️ 提出後に修正");
    }

    return parts.length > 0 ? parts.join(" / ") : null;
  };

  // ログの重要度判定
  const getSeverity = (log: any) => {
    // 削除は常に重要
    if (log.action === "Delete") return "critical";

    // 提出後の修正は警告
    if (log.action === "Edit" && log.metadata?.beforeStatus === "SUBMITTED") {
      return "warn";
    }

    return "info";
  };

  const filteredLogs = data?.logs.filter((log) => {
    // 提出後編集フィルタ
    if (postSubmissionEditOnly) {
      if (log.action !== "Edit") return false;
      if (
        !log.metadata ||
        typeof log.metadata !== "object" ||
        !("beforeStatus" in log.metadata) ||
        log.metadata.beforeStatus !== "SUBMITTED"
      ) {
        return false;
      }
    }

    return true;
  });

  const totalPages = data?.total ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">
            監査ログ
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            システム操作履歴の確認（管理者専用）
          </p>
        </div>
      </div>

      {/* サマリー */}
      {data && (
        <div className="bg-card mb-6 rounded-lg border p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">総ログ数</p>
              <p className="text-xl font-bold sm:text-2xl">{data.total}件</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">表示中</p>
              <p className="text-xl font-bold sm:text-2xl">{filteredLogs?.length}件</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-muted-foreground text-sm">期間</p>
              <p className="text-sm">
                {selectedDays === 1 ? "今日" : `過去${selectedDays}日間`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* フィルタ */}
      <div className="bg-card mb-6 rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">フィルタ</h2>
        </div>
        <div className="space-y-4">
          {/* 期間フィルタ（クイック選択） */}
          <div>
            <label className="mb-2 block text-sm font-medium">期間</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDays === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDays(1)}
              >
                今日
              </Button>
              <Button
                variant={selectedDays === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDays(7)}
              >
                7日間
              </Button>
              <Button
                variant={selectedDays === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDays(30)}
              >
                30日間
              </Button>
            </div>
          </div>

          {/* その他のフィルタ */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">対象</label>
              <select
                value={selectedResourceType}
                onChange={(e) => setSelectedResourceType(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">全て</option>
                <option value="CareRecipient">利用者</option>
                <option value="GuideRecord">ガイド記録</option>
                <option value="Assessment">アセスメント</option>
                <option value="ServiceRecord">サービス実績</option>
                <option value="DailyLog">業務日誌</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">操作</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">全て</option>
                <option value="View">閲覧</option>
                <option value="Create">作成</option>
                <option value="Edit">編集</option>
                <option value="Delete">削除</option>
                <option value="Submit">提出</option>
                <option value="Approve">承認</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">実行者</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">全員</option>
                {data?.logs
                  .map((log: any) => log.user)
                  .filter(
                    (user: any, index: number, self: any[]) =>
                      self.findIndex((u: any) => u.id === user.id) === index
                  )
                  .map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({getRoleLabel(user.role)})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">特殊フィルタ</label>
              <div className="flex items-center rounded-md border px-3 py-2">
                <input
                  type="checkbox"
                  checked={postSubmissionEditOnly}
                  onChange={(e) => setPostSubmissionEditOnly(e.target.checked)}
                  className="h-4 w-4"
                  id="postSubmitEdit"
                />
                <label htmlFor="postSubmitEdit" className="ml-2 text-sm">
                  提出後の修正のみ
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タイムライン形式のログ一覧 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-card rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : !filteredLogs || filteredLogs.length === 0 ? (
          <div className="bg-card rounded-lg border p-12 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground mb-4 text-lg">
              該当する監査ログがありません
            </p>
          </div>
        ) : (
          <>
            {filteredLogs?.map((log: any) => {
              const severity = getSeverity(log);
              const summary = summarizeMetadata(log.metadata, log.resourceType);
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className={`bg-card rounded-lg border transition-shadow hover:shadow-md ${
                    severity === "critical"
                      ? "border-l-4 border-l-red-500"
                      : severity === "warn"
                        ? "border-l-4 border-l-orange-500"
                        : ""
                  }`}
                >
                  {/* カード上段：誰が・いつ・何を・どれに */}
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        {/* 重要度アイコン */}
                        {severity === "critical" && (
                          <div className="mt-1 rounded-full bg-red-100 p-2">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                        {severity === "warn" && (
                          <div className="mt-1 rounded-full bg-orange-100 p-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                        {severity === "info" && (
                          <div className="mt-1 rounded-full bg-blue-100 p-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        )}

                        <div className="flex-1">
                          {/* 1行サマリー：誰が・いつ・何を・どれに */}
                          <p className="mb-1 text-sm sm:text-base">
                            <span className="font-semibold">{log.user.name}</span>
                            <span className="text-muted-foreground mx-1">が</span>
                            {(() => {
                              const resourceName = getResourceName(log.resourceType, log.resourceId, log.metadata);
                              return resourceName ? (
                                <>
                                  <span className="font-medium text-blue-600">
                                    {getResourceTypeLabel(log.resourceType)}
                                  </span>
                                  <span className="text-muted-foreground mx-1">「</span>
                                  <span className="font-semibold text-blue-700">
                                    {resourceName}
                                  </span>
                                  <span className="text-muted-foreground mx-1">」</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium text-blue-600">
                                    {getResourceTypeLabel(log.resourceType)}
                                  </span>
                                </>
                              );
                            })()}
                            <span className="text-muted-foreground mx-1">を</span>
                            <span
                              className={`font-medium ${
                                log.action === "Delete"
                                  ? "text-red-600"
                                  : log.action === "Edit"
                                    ? "text-orange-600"
                                    : log.action === "Create"
                                      ? "text-green-600"
                                      : "text-gray-700"
                              }`}
                            >
                              {getActionLabel(log.action)}
                            </span>
                          </p>

                          {/* 日時 */}
                          <p className="text-muted-foreground text-xs sm:text-sm">
                            {new Date(log.createdAt).toLocaleString("ja-JP", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            <span className="mx-2">•</span>
                            <span className="text-muted-foreground">
                              {log.user.email}
                            </span>
                            <span className="mx-2">•</span>
                            <span className="text-muted-foreground">
                              {getRoleLabel(log.user.role)}
                            </span>
                          </p>

                          {/* メタデータ要約 */}
                          {summary && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700">{summary}</p>
                            </div>
                          )}

                          {/* 変更理由 */}
                          {log.changeNote && (
                            <div className="mt-2 rounded-md bg-gray-50 p-2">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">理由:</span> {log.changeNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 操作ボタン */}
                      <div className="flex items-center gap-2">
                        <Link href={`/audit-logs/${log.id}`}>
                          <Button variant="outline" size="sm">
                            詳細
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedLogId(isExpanded ? null : log.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* 展開エリア：技術詳細 */}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        <h3 className="mb-2 text-sm font-semibold">技術詳細</h3>
                        <div className="grid gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">リソースID:</span>{" "}
                            <span className="font-mono text-xs">{log.resourceId}</span>
                          </div>
                          {log.path && (
                            <div>
                              <span className="text-muted-foreground">パス:</span>{" "}
                              <span className="text-xs">{log.path}</span>
                            </div>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <span className="text-muted-foreground">メタデータ:</span>
                              <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">タイムスタンプ:</span>{" "}
                            <span className="font-mono text-xs">
                              {new Date(log.createdAt).toISOString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="bg-card flex items-center justify-between rounded-lg border px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  前へ
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages} ページ
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= (data?.total || 0)}
                  onClick={() => setOffset(offset + limit)}
                >
                  次へ
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
