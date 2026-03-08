"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";

const SHIFT_LABELS: Record<string, string> = {
  Day: "日勤",
  Late: "遅番",
  Night: "夜勤",
};

const SHIFT_COLORS: Record<string, string> = {
  Day: "bg-yellow-100 text-yellow-800",
  Late: "bg-orange-100 text-orange-800",
  Night: "bg-blue-100 text-blue-800",
};

export default function LogListPage() {
  const params = useParams();
  const unitId = params.id as string;

  const { data: unit } = trpc.unit.get.useQuery({ id: unitId });
  const { data, isLoading, fetchNextPage, hasNextPage } =
    trpc.dailyLog.list.useInfiniteQuery(
      { unitId, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const logs = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/units/${unitId}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {unit?.name || "ユニット詳細"}に戻る
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">業務日誌</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unit?.name}
          </p>
        </div>
        <Link href={`/units/${unitId}/log/new`}>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <p className="text-muted-foreground mb-4">業務日誌がまだありません</p>
          <Link href={`/units/${unitId}/log/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              最初の業務日誌を作成
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <div className="divide-y">
            {logs.map((log) => (
              <Link key={log.id} href={`/units/${unitId}/log/${log.id}`}>
                <div className="hover:bg-accent flex items-center justify-between p-4 transition-colors">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                    <div className="shrink-0 text-center">
                      <p className="text-base font-bold sm:text-lg">
                        {new Date(log.logDate).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(log.logDate).toLocaleDateString("ja-JP", {
                          weekday: "short",
                        })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            SHIFT_COLORS[log.shift] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {SHIFT_LABELS[log.shift] || log.shift}
                        </span>
                        {log.majorEvent && (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="hidden sm:inline">重大イベント</span>
                            <span className="sm:hidden">重大</span>
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        {log.staff.name || log.staff.email}
                        {log.staffRole && <span className="hidden sm:inline"> ({log.staffRole})</span>}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(log.shiftStart).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        〜
                        {new Date(log.shiftEnd).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <span className="ml-2">· {log._count.entries}名</span>
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="text-muted-foreground h-4 w-4 shrink-0 rotate-180" />
                </div>
              </Link>
            ))}
          </div>
          {hasNextPage && (
            <div className="border-t p-4 text-center">
              <Button variant="outline" onClick={() => fetchNextPage()}>
                さらに読み込む
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
