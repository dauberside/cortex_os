"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GraphView } from "@/components/GraphView";

export default function GraphPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const { data: graphData, isLoading } = trpc.link.getGraph.useQuery();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleNodeClick = (node: any) => {
    setSelectedNoteId(node.id);
  };

  const handleViewNote = () => {
    if (selectedNoteId) {
      router.push(`/?noteId=${selectedNoteId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-2xl font-bold text-black sm:text-3xl">
              Cortex OS - グラフビュー
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="self-start"
              >
                ノート管理へ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="self-start"
              >
                AIチャットへ
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="max-w-[150px] truncate text-xs text-black sm:max-w-none sm:text-sm">
              {session.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              ログアウト
            </Button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">ノート数</p>
            <p className="text-2xl font-bold text-black">
              {graphData?.nodes.length || 0}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">リンク数</p>
            <p className="text-2xl font-bold text-black">
              {graphData?.links.length || 0}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">平均リンク数</p>
            <p className="text-2xl font-bold text-black">
              {graphData?.nodes.length
                ? (
                    (graphData?.links.length || 0) / graphData.nodes.length
                  ).toFixed(1)
                : 0}
            </p>
          </div>
        </div>

        {/* グラフビュー */}
        {graphData && graphData.nodes.length > 0 ? (
          <>
            <GraphView
              nodes={graphData.nodes}
              links={graphData.links}
              onNodeClick={handleNodeClick}
            />
            {selectedNoteId && (
              <div className="mt-4 flex justify-center">
                <Button onClick={handleViewNote}>選択中のノートを表示</Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="mb-4 text-lg text-black">
              まだノートが作成されていません
            </p>
            <Button onClick={() => router.push("/")}>ノートを作成する</Button>
          </div>
        )}
      </div>
    </div>
  );
}
