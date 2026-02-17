"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AIPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: conversations } = trpc.ai.listConversations.useQuery();
  const { data: currentConversation } = trpc.ai.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );
  const { data: notes } = trpc.note.list.useQuery();

  const sendMessage = trpc.ai.sendMessage.useMutation({
    onSuccess: (data) => {
      utils.ai.getConversation.invalidate();
      utils.ai.listConversations.invalidate();
      setConversationId(data.conversationId);
      setMessage("");
    },
  });

  const deleteConversation = trpc.ai.deleteConversation.useMutation({
    onSuccess: () => {
      utils.ai.listConversations.invalidate();
      setConversationId(null);
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage.mutate({
      message: message.trim(),
      conversationId: conversationId || undefined,
      noteId: selectedNoteId || undefined,
    });
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setSelectedNoteId(null);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Cortex OS - AIチャット</h1>
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
                onClick={() => router.push("/graph")}
                className="self-start"
              >
                グラフビュー
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-black truncate max-w-[150px] sm:max-w-none">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              ログアウト
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-4">
          {/* サイドバー：会話一覧 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">会話履歴</h2>
                <Button size="sm" onClick={handleNewConversation}>
                  新規会話
                </Button>
              </div>
              <div className="space-y-2">
                {conversations?.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className={`rounded border p-3 hover:bg-gray-50 ${
                      conversationId === conv.conversationId
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                  >
                    <button
                      onClick={() => setConversationId(conv.conversationId)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-medium text-black">{conv.previewText}</p>
                      <p className="text-xs text-black">
                        {conv.messageCount}件のメッセージ
                      </p>
                      <p className="text-xs text-black">
                        {new Date(conv.lastMessageAt).toLocaleString("ja-JP")}
                      </p>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        deleteConversation.mutate({
                          conversationId: conv.conversationId,
                        })
                      }
                      disabled={deleteConversation.isPending}
                      className="mt-2 w-full"
                    >
                      削除
                    </Button>
                  </div>
                ))}
                {conversations?.length === 0 && (
                  <p className="text-sm text-black">会話履歴がありません</p>
                )}
              </div>
            </div>
          </div>

          {/* メインコンテンツ：チャット */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-3">
            {/* ノート選択（オプション） */}
            {!conversationId && (
              <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-black">
                  ノートに関する質問（オプション）
                </h2>
                <select
                  value={selectedNoteId || ""}
                  onChange={(e) => setSelectedNoteId(e.target.value || null)}
                  className="w-full rounded border p-2 text-black"
                >
                  <option value="">ノートを選択しない</option>
                  {notes?.map((note: { id: string; title: string }) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* チャット表示エリア */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">
                  {conversationId ? "会話" : "新規会話"}
                </h2>
                {conversationId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNewConversation}
                  >
                    新規会話を開始
                  </Button>
                )}
              </div>

              {/* メッセージ一覧 */}
              <div className="mb-4 space-y-4" style={{ minHeight: "300px" }}>
                {currentConversation?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 sm:p-4 ${
                      msg.role === "user"
                        ? "ml-4 sm:ml-8 bg-blue-100"
                        : "mr-4 sm:mr-8 bg-gray-100"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-black">
                        {msg.role === "user" ? "あなた" : "AI"}
                      </span>
                      {msg.note && (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-black">
                          📝 {msg.note.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-black">{msg.content}</p>
                    <p className="mt-2 text-xs text-black">
                      {new Date(msg.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                ))}
                {!currentConversation ||
                  (currentConversation.length === 0 && (
                    <div className="flex h-full items-center justify-center text-black">
                      <p>メッセージを送信して会話を開始してください</p>
                    </div>
                  ))}
              </div>

              {/* メッセージ入力フォーム */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="w-full rounded border p-3 text-black placeholder:text-gray-500"
                  rows={3}
                  disabled={sendMessage.isPending}
                />
                <div className="flex justify-between">
                  <div className="text-sm text-black">
                    {selectedNoteId && !conversationId && (
                      <span>
                        📝 選択中のノート:{" "}
                        {
                          notes?.find(
                            (n: { id: string }) => n.id === selectedNoteId
                          )?.title
                        }
                      </span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? "送信中..." : "送信"}
                  </Button>
                </div>
              </form>

              {sendMessage.error && (
                <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
                  <p className="text-sm font-semibold text-red-700">エラー</p>
                  <p className="text-sm text-red-700">{sendMessage.error.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
