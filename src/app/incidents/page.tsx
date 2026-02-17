"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SeverityFilter = "P0" | "P1" | "P2" | "P3" | "all";
type StatusFilter =
  | "Detected"
  | "Investigating"
  | "Mitigated"
  | "Resolved"
  | "Postmortem"
  | "all";

export default function IncidentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // フォームステート
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"P0" | "P1" | "P2" | "P3">("P2");
  const [affectedServices, setAffectedServices] = useState("");
  const [impactSummary, setImpactSummary] = useState("");
  const [commsChannelUrl, setCommsChannelUrl] = useState("");

  const utils = trpc.useUtils();

  const { data: incidents, isLoading } = trpc.incident.list.useQuery({
    severity: severityFilter,
    status: statusFilter,
  });

  const createIncident = trpc.incident.create.useMutation({
    onSuccess: () => {
      utils.incident.list.invalidate();
      setShowCreateForm(false);
      setTitle("");
      setAffectedServices("");
      setImpactSummary("");
      setCommsChannelUrl("");
      setSeverity("P2");
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

  const handleCreateIncident = () => {
    if (!title.trim()) return;

    createIncident.mutate({
      title,
      severity,
      affectedServices: affectedServices
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      impactSummary: impactSummary || undefined,
      commsChannelUrl: commsChannelUrl || "",
    });
  };

  const getSeverityColor = (sev: string) => {
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
        return "bg-red-100 text-red-800 border-red-300";
      case "Investigating":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Mitigated":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-300";
      case "Postmortem":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              インシデント管理
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              重度障害の検出から解決までを追跡
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/")}>ノート一覧</Button>
            <Button onClick={() => router.push("/graph")}>グラフ表示</Button>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-red-600 hover:bg-red-700"
            >
              {showCreateForm ? "キャンセル" : "新規インシデント"}
            </Button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">新規インシデント作成</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border p-2"
                  placeholder="例: 本番DBレプリケーション遅延"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    重大度
                  </label>
                  <select
                    value={severity}
                    onChange={(e) =>
                      setSeverity(e.target.value as "P0" | "P1" | "P2" | "P3")
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="P0">P0 - サービス全停止</option>
                    <option value="P1">P1 - 主要機能停止</option>
                    <option value="P2">P2 - 一部機能影響</option>
                    <option value="P3">P3 - 軽微な影響</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    影響サービス (カンマ区切り)
                  </label>
                  <input
                    type="text"
                    value={affectedServices}
                    onChange={(e) => setAffectedServices(e.target.value)}
                    className="w-full rounded border p-2"
                    placeholder="例: API, Web, Mobile"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  影響の概要
                </label>
                <textarea
                  value={impactSummary}
                  onChange={(e) => setImpactSummary(e.target.value)}
                  className="w-full rounded border p-2"
                  rows={3}
                  placeholder="ユーザーへの影響を記述..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  コミュニケーションチャンネルURL
                </label>
                <input
                  type="url"
                  value={commsChannelUrl}
                  onChange={(e) => setCommsChannelUrl(e.target.value)}
                  className="w-full rounded border p-2"
                  placeholder="https://slack.com/..."
                />
              </div>

              <Button
                onClick={handleCreateIncident}
                disabled={!title.trim() || createIncident.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {createIncident.isPending
                  ? "作成中..."
                  : "インシデント作成"}
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow">
          <div>
            <label className="mb-1 block text-sm font-medium">重大度</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
              className="rounded border p-2"
            >
              <option value="all">全て</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded border p-2"
            >
              <option value="all">全て</option>
              <option value="Detected">検出</option>
              <option value="Investigating">調査中</option>
              <option value="Mitigated">緩和済み</option>
              <option value="Resolved">解決済み</option>
              <option value="Postmortem">ポストモーテム</option>
            </select>
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {incidents && incidents.length === 0 && (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-gray-500">
                インシデントがありません。新規作成してください。
              </p>
            </div>
          )}

          {incidents?.map((incident) => (
            <div
              key={incident.id}
              onClick={() => router.push(`/incidents/${incident.id}`)}
              className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${getSeverityColor(incident.severity || "")}`}
                    >
                      {incident.severity}
                    </span>
                    <span
                      className={`rounded border px-2 py-1 text-xs font-medium ${getStatusColor(incident.incidentStatus)}`}
                    >
                      {incident.incidentStatus}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    {incident.title}
                  </h3>

                  {incident.affectedServices &&
                    incident.affectedServices.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {incident.affectedServices.map((service, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                  <div className="mt-3 text-sm text-gray-600">
                    <div>
                      検出:{" "}
                      {incident.detectedAt
                        ? new Date(incident.detectedAt).toLocaleString("ja-JP")
                        : "N/A"}
                    </div>
                    {incident.mitigatedAt && (
                      <div>
                        緩和:{" "}
                        {new Date(incident.mitigatedAt).toLocaleString("ja-JP")}
                      </div>
                    )}
                    {incident.resolvedAt && (
                      <div>
                        解決:{" "}
                        {new Date(incident.resolvedAt).toLocaleString("ja-JP")}
                      </div>
                    )}
                  </div>

                  {/* Current Roles */}
                  {incident.incidentRoles &&
                    incident.incidentRoles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {incident.incidentRoles.map((role) => (
                          <span
                            key={role.id}
                            className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {role.role}: {role.assignedTo}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
