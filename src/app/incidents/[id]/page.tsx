"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

type EventType = "Action" | "Decision" | "Update" | "Evidence";
type RoleType = "IC" | "Comms" | "SME";
type ActionStatus = "Open" | "InProgress" | "Done";

export default function IncidentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const incidentId = params.id as string;

  // Timeline state
  const [eventType, setEventType] = useState<EventType>("Update");
  const [eventContent, setEventContent] = useState("");

  // Role state
  const [roleType, setRoleType] = useState<RoleType>("IC");
  const [assignedTo, setAssignedTo] = useState("");

  // Action item state
  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [actionDueDate, setActionDueDate] = useState("");

  // UI state
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const utils = trpc.useUtils();

  const { data: incidentData, isLoading } = trpc.incident.get.useQuery({
    id: incidentId,
  });
  const incident = incidentData as any;

  const updateStatus = trpc.incident.updateStatus.useMutation({
    onSuccess: () => {
      utils.incident.get.invalidate({ id: incidentId });
      setSelectedStatus("");
    },
  });

  const addEvent = trpc.event.add.useMutation({
    onSuccess: () => {
      utils.incident.get.invalidate({ id: incidentId });
      setEventContent("");
    },
  });

  const assignRole = trpc.role.assign.useMutation({
    onSuccess: () => {
      utils.incident.get.invalidate({ id: incidentId });
      setAssignedTo("");
    },
  });

  const endRole = trpc.role.end.useMutation({
    onSuccess: () => {
      utils.incident.get.invalidate({ id: incidentId });
    },
  });

  const createActionItem = trpc.actionItem.create.useMutation({
    onSuccess: () => {
      utils.incident.get.invalidate({ id: incidentId });
      setActionTitle("");
      setActionDescription("");
      setActionOwner("");
      setActionDueDate("");
    },
  });

  const updateActionItem = trpc.actionItem.update.useMutation({
    onSuccess: () => {
      utils.incident.get.invalidate({ id: incidentId });
    },
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        読み込み中...
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (!incident) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        インシデントが見つかりません
      </div>
    );
  }

  const handleAddEvent = () => {
    if (!eventContent.trim()) return;
    addEvent.mutate({
      noteId: incidentId,
      eventType,
      content: eventContent,
    });
  };

  const handleAssignRole = () => {
    if (!assignedTo.trim()) return;
    assignRole.mutate({
      noteId: incidentId,
      role: roleType,
      assignedTo,
    });
  };

  const handleCreateActionItem = () => {
    if (!actionTitle.trim()) return;
    createActionItem.mutate({
      noteId: incidentId,
      title: actionTitle,
      description: actionDescription || undefined,
      owner: actionOwner || undefined,
      dueDate: actionDueDate ? new Date(actionDueDate) : undefined,
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) return;
    updateStatus.mutate({
      id: incidentId,
      status: selectedStatus as any,
    });
  };

  const getSeverityColor = (sev: string | null) => {
    switch (sev) {
      case "P0":
        return "bg-red-600 text-white";
      case "P1":
        return "bg-orange-500 text-white";
      case "P2":
        return "bg-yellow-500 text-black";
      case "P3":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (stat: string | null) => {
    switch (stat) {
      case "Detected":
        return "bg-red-100 text-red-800";
      case "Investigating":
        return "bg-orange-100 text-orange-800";
      case "Mitigated":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Postmortem":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Action":
        return "bg-green-100 text-green-800";
      case "Decision":
        return "bg-purple-100 text-purple-800";
      case "Update":
        return "bg-blue-100 text-blue-800";
      case "Evidence":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={() => router.push("/incidents")} className="mb-4">
            ← インシデント一覧
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded px-3 py-1 text-sm font-bold ${getSeverityColor(incident.severity)}`}
                >
                  {incident.severity}
                </span>
                <span
                  className={`rounded px-3 py-1 text-sm font-medium ${getStatusColor(incident.incidentStatus)}`}
                >
                  {incident.incidentStatus}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {incident.title}
              </h1>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-500">検出時刻</div>
              <div className="text-lg font-medium">
                {incident.detectedAt
                  ? new Date(incident.detectedAt).toLocaleString("ja-JP")
                  : "N/A"}
              </div>
            </div>
            {incident.mitigatedAt && (
              <div className="rounded-lg bg-white p-4 shadow">
                <div className="text-sm text-gray-500">緩和時刻</div>
                <div className="text-lg font-medium">
                  {new Date(incident.mitigatedAt).toLocaleString("ja-JP")}
                </div>
              </div>
            )}
            {incident.resolvedAt && (
              <div className="rounded-lg bg-white p-4 shadow">
                <div className="text-sm text-gray-500">解決時刻</div>
                <div className="text-lg font-medium">
                  {new Date(incident.resolvedAt).toLocaleString("ja-JP")}
                </div>
              </div>
            )}
          </div>

          {/* Affected Services */}
          {incident.affectedServices &&
            incident.affectedServices.length > 0 && (
              <div className="mt-4 rounded-lg bg-white p-4 shadow">
                <div className="mb-2 text-sm font-medium text-gray-700">
                  影響を受けるサービス
                </div>
                <div className="flex flex-wrap gap-2">
                  {incident.affectedServices.map(
                    (service: string, idx: number) => (
                      <span
                        key={idx}
                        className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-800"
                      >
                        {service}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Communication Channel */}
          {incident.commsChannelUrl && (
            <div className="mt-4 rounded-lg bg-white p-4 shadow">
              <div className="mb-1 text-sm font-medium text-gray-700">
                コミュニケーションチャンネル
              </div>
              <a
                href={incident.commsChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {incident.commsChannelUrl}
              </a>
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">ステータス更新</h2>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 rounded border p-2"
            >
              <option value="">ステータスを選択...</option>
              <option value="Detected">検出</option>
              <option value="Investigating">調査中</option>
              <option value="Mitigated">緩和済み</option>
              <option value="Resolved">解決済み</option>
              <option value="Postmortem">ポストモーテム</option>
            </select>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || updateStatus.isPending}
            >
              更新
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">タイムライン</h2>

            {/* Add Event */}
            <div className="mb-6 space-y-2 border-b pb-4">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full rounded border p-2"
              >
                <option value="Action">アクション</option>
                <option value="Decision">決定</option>
                <option value="Update">更新</option>
                <option value="Evidence">証拠</option>
              </select>
              <textarea
                value={eventContent}
                onChange={(e) => setEventContent(e.target.value)}
                placeholder="イベント内容..."
                className="w-full rounded border p-2"
                rows={2}
              />
              <Button
                onClick={handleAddEvent}
                disabled={!eventContent.trim() || addEvent.isPending}
                className="w-full"
              >
                追加
              </Button>
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {incident.incidentEvents?.map((event: any) => (
                <div key={event.id} className="border-l-4 border-gray-300 pl-4">
                  <div className="flex items-start justify-between">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getEventTypeColor(event.eventType)}`}
                    >
                      {event.eventType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.createdAt).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{event.content}</p>
                  {event.createdBy && (
                    <p className="mt-1 text-xs text-gray-500">
                      by {event.createdBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">役割割り当て</h2>

            {/* Assign Role */}
            <div className="mb-6 space-y-2 border-b pb-4">
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as RoleType)}
                className="w-full rounded border p-2"
              >
                <option value="IC">IC (Incident Commander)</option>
                <option value="Comms">Comms (Communication Lead)</option>
                <option value="SME">SME (Subject Matter Expert)</option>
              </select>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="担当者名..."
                className="w-full rounded border p-2"
              />
              <Button
                onClick={handleAssignRole}
                disabled={!assignedTo.trim() || assignRole.isPending}
                className="w-full"
              >
                割り当て
              </Button>
            </div>

            {/* Roles List */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">現在の役割</h3>
              {incident.incidentRoles
                ?.filter((role: any) => !role.endedAt)
                .map((role: any) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded bg-blue-50 p-3"
                  >
                    <div>
                      <div className="font-medium text-blue-900">
                        {role.role}
                      </div>
                      <div className="text-sm text-blue-700">
                        {role.assignedTo}
                      </div>
                      <div className="text-xs text-blue-600">
                        {new Date(role.assignedAt).toLocaleString("ja-JP")}
                      </div>
                    </div>
                    <Button
                      onClick={() => endRole.mutate({ id: role.id })}
                      size="sm"
                      variant="outline"
                    >
                      終了
                    </Button>
                  </div>
                ))}

              <h3 className="mt-4 font-medium text-gray-700">過去の役割</h3>
              {incident.incidentRoles
                ?.filter((role: any) => role.endedAt)
                .map((role: any) => (
                  <div key={role.id} className="rounded bg-gray-50 p-3">
                    <div className="font-medium text-gray-700">{role.role}</div>
                    <div className="text-sm text-gray-600">
                      {role.assignedTo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(role.assignedAt).toLocaleString("ja-JP")} ~{" "}
                      {role.endedAt &&
                        new Date(role.endedAt).toLocaleString("ja-JP")}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">アクションアイテム</h2>

          {/* Add Action Item */}
          <div className="mb-6 space-y-2 border-b pb-4">
            <input
              type="text"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder="タイトル..."
              className="w-full rounded border p-2"
            />
            <textarea
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="説明（任意）..."
              className="w-full rounded border p-2"
              rows={2}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={actionOwner}
                onChange={(e) => setActionOwner(e.target.value)}
                placeholder="担当者（任意）..."
                className="w-full rounded border p-2"
              />
              <input
                type="date"
                value={actionDueDate}
                onChange={(e) => setActionDueDate(e.target.value)}
                className="w-full rounded border p-2"
              />
            </div>
            <Button
              onClick={handleCreateActionItem}
              disabled={!actionTitle.trim() || createActionItem.isPending}
              className="w-full"
            >
              追加
            </Button>
          </div>

          {/* Action Items List */}
          <div className="space-y-3">
            {incident.incidentActions?.map((action: any) => (
              <div key={action.id} className="rounded border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {action.title}
                    </h3>
                    {action.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {action.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      {action.owner && <span>担当: {action.owner}</span>}
                      {action.dueDate && (
                        <span>
                          期限:{" "}
                          {new Date(action.dueDate).toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                  </div>
                  <select
                    value={action.status}
                    onChange={(e) =>
                      updateActionItem.mutate({
                        id: action.id,
                        status: e.target.value as ActionStatus,
                      })
                    }
                    className="ml-4 rounded border p-1 text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="InProgress">進行中</option>
                    <option value="Done">完了</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
