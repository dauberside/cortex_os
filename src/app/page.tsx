"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SortableNoteCard } from "@/components/SortableNoteCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"custom" | "title" | "createdAt" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAllNotes, setShowAllNotes] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const utils = trpc.useUtils();
  const { data: notes, isLoading } = trpc.note.list.useQuery({
    sortBy,
    sortOrder,
  });
  const { data: tags } = trpc.tag.list.useQuery();
  const { data: filteredNotes } = trpc.tag.getNotesByTag.useQuery(
    { tagId: filterTagId! },
    { enabled: !!filterTagId }
  );
  const { data: searchResults } = trpc.note.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createNote = trpc.note.create.useMutation({
    onSuccess: async (note) => {
      // タグを追加
      if (selectedTags.length > 0) {
        await Promise.all(
          selectedTags.map((tagId) =>
            addTagToNote.mutateAsync({ noteId: note.id, tagId })
          )
        );
      }
      utils.note.list.invalidate();
      utils.tag.list.invalidate();
      setTitle("");
      setContent("");
      setSelectedTags([]);
    },
  });

  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      setEditingId(null);
      setTitle("");
      setContent("");
      setSelectedTags([]);
    },
  });

  const deleteNote = trpc.note.delete.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      utils.tag.list.invalidate();
    },
  });

  const createTag = trpc.tag.create.useMutation({
    onSuccess: () => {
      utils.tag.list.invalidate();
      setNewTagName("");
    },
  });

  const deleteTag = trpc.tag.delete.useMutation({
    onSuccess: () => {
      utils.tag.list.invalidate();
      utils.note.list.invalidate();
    },
  });

  const addTagToNote = trpc.tag.addToNote.useMutation({
    onSuccess: () => {
      utils.tag.list.invalidate();
    },
  });

  const importNotes = trpc.note.importNotes.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
    },
  });

  const updateOrder = trpc.note.updateOrder.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
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

    if (editingId) {
      updateNote.mutate({ id: editingId, title, content, tagIds: selectedTags });
    } else {
      createNote.mutate({ title, content });
    }
  };

  const handleEdit = async (note: { id: string; title: string; content: string }) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);

    // ノートの詳細情報（タグ含む）を取得
    try {
      const noteDetail = await utils.client.note.get.query({ id: note.id });
      if (noteDetail.tags) {
        setSelectedTags(noteDetail.tags.map((tag: { id: string }) => tag.id));
      }
    } catch (error) {
      console.error("ノート詳細の取得に失敗:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedTags([]);
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTag.mutate({ name: newTagName.trim() });
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearFilters = () => {
    setFilterTagId(null);
    setSearchQuery("");
  };

  const handleExportJSON = async () => {
    const data = await utils.note.exportAll.fetch();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortex-notes-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = async () => {
    const data = await utils.note.exportAll.fetch();
    const markdown = data
      ?.map(
        (note: { title: string; content: string; updatedAt: Date }) =>
          `# ${note.title}\n\n${note.content}\n\n---\n更新日時: ${new Date(note.updatedAt).toLocaleString("ja-JP")}\n`
      )
      .join("\n\n");
    const blob = new Blob([markdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortex-notes-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const notes = Array.isArray(json) ? json : [json];
        await importNotes.mutateAsync({
          notes: notes.map((n: { title: string; content: string }) => ({
            title: n.title || "無題",
            content: n.content || "",
          })),
        });
        alert(`${notes.length}件のノートをインポートしました`);
      } catch (error) {
        alert("インポートに失敗しました: " + (error as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await utils.client.excel.downloadTemplate.query();
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("テンプレートのダウンロードに失敗しました: " + (error as Error).message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const result = await utils.client.excel.exportNotes.query();
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Excelエクスポートに失敗しました: " + (error as Error).message);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const byteArray = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < byteArray.byteLength; i++) {
          binary += String.fromCharCode(byteArray[i]);
        }
        const base64 = btoa(binary);

        const result = await utils.client.excel.importNotes.mutate({ fileData: base64 });

        if (result.errors.length > 0) {
          alert(
            `インポート完了: ${result.success}件成功\n\nエラー:\n${result.errors.join("\n")}`
          );
        } else {
          alert(`${result.success}件のノートをインポートしました`);
        }

        utils.note.list.invalidate();
        utils.tag.list.invalidate();
      } catch (error) {
        alert("Excelインポートに失敗しました: " + (error as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // 検索 > タグフィルター > 全ノートの優先順位で表示
  const displayNotes = searchQuery
    ? searchResults
    : filterTagId
      ? filteredNotes
      : notes;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !displayNotes) return;

    const oldIndex = displayNotes.findIndex((n: any) => n.id === active.id);
    const newIndex = displayNotes.findIndex((n: any) => n.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 配列を並び替え
    const reorderedNotes = [...displayNotes];
    const [movedNote] = reorderedNotes.splice(oldIndex, 1);
    reorderedNotes.splice(newIndex, 0, movedNote);

    // 並び順を更新
    updateOrder.mutate({
      noteIds: reorderedNotes.map((n: any) => n.id),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Cortex OS - ノート管理</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="self-start"
              >
                AIチャット
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/graph")}
                className="self-start"
              >
                グラフビュー
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/incidents")}
                className="self-start bg-red-50 hover:bg-red-100"
              >
                インシデント管理
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

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          {/* メインコンテンツ */}
          <div className="space-y-4 sm:space-y-8 lg:col-span-2">
            {/* ノート作成・編集フォーム */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-black">
                {editingId ? "ノートを編集" : "新規ノート"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border p-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">内容</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded border p-2 text-black"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    タグ
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags?.map((tag: { id: string; name: string }) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTagSelection(tag.id)}
                        className={`rounded-full px-3 py-1 text-sm ${
                          selectedTags.includes(tag.id)
                            ? "bg-black text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {tags?.length === 0 && (
                      <p className="text-sm text-gray-500">
                        タグがありません。サイドバーから作成してください。
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createNote.isPending || updateNote.isPending}
                  >
                    {editingId ? "更新" : "作成"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      キャンセル
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* 検索・ソート */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-black">
                検索・並び替え
              </h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="タイトル、内容、タグで検索..."
                    className="flex-1 rounded border p-2 text-black placeholder:text-gray-500"
                  />
                  {(searchQuery || filterTagId) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearFilters}
                    >
                      クリア
                    </Button>
                  )}
                </div>
                {searchQuery && searchResults && (
                  <div className="rounded bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    {searchResults.length}件の検索結果
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | "custom"
                          | "title"
                          | "createdAt"
                          | "updatedAt"
                      )
                    }
                    className="flex-1 rounded border p-2 text-sm text-black"
                  >
                    <option value="updatedAt">更新日時順</option>
                    <option value="createdAt">作成日時順</option>
                    <option value="title">タイトル順</option>
                    <option value="custom">カスタム順序</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="rounded border p-2 text-sm text-black"
                  >
                    <option value="desc">降順</option>
                    <option value="asc">昇順</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ノート一覧 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">
                  {searchQuery
                    ? "検索結果"
                    : filterTagId
                      ? "絞り込み結果"
                      : "ノート一覧"}
                </h2>
                {sortBy === "custom" && (
                  <p className="text-sm text-black">
                    ドラッグして並び替え可能
                  </p>
                )}
              </div>
              {isLoading && <p className="text-black">読み込み中...</p>}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayNotes?.map((n: any) => n.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {(showAllNotes ? displayNotes : displayNotes?.slice(0, 3))?.map(
                    (note: {
                      id: string;
                      title: string;
                      content: string;
                      updatedAt: Date;
                    }) => (
                      <SortableNoteCard
                        key={note.id}
                        note={note}
                        displayNotes={displayNotes}
                        onEdit={handleEdit}
                        onDelete={() => deleteNote.mutate({ id: note.id })}
                        isDraggable={sortBy === "custom"}
                        searchQuery={searchQuery}
                      />
                    )
                  )}
                </SortableContext>
              </DndContext>

              {/* もっと見る/閉じるボタン */}
              {displayNotes && displayNotes.length > 3 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllNotes(!showAllNotes)}
                  >
                    {showAllNotes ? (
                      <>
                        閉じる（{displayNotes.length - 3}件を非表示）
                      </>
                    ) : (
                      <>
                        もっと見る（残り{displayNotes.length - 3}件）
                      </>
                    )}
                  </Button>
                </div>
              )}

              {displayNotes?.length === 0 && (
                <p className="text-black">ノートがありません</p>
              )}
            </div>
          </div>

          {/* サイドバー：タグ管理 */}
          <div className="space-y-4 sm:space-y-6">
            {/* タグ作成 */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-black">新規タグ</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="タグ名"
                  className="flex-1 rounded border p-2 text-sm text-black placeholder:text-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                >
                  追加
                </Button>
              </div>
            </div>

            {/* タグ一覧 */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">タグ一覧</h2>
                {filterTagId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFilterTagId(null)}
                  >
                    フィルタ解除
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {tags?.map(
                  (tag: { id: string; name: string; noteCount: number }) => (
                    <div
                      key={tag.id}
                      className={`flex items-center justify-between rounded border p-2 transition-colors ${
                        filterTagId === tag.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={() => setFilterTagId(tag.id)}
                        className="flex-1 text-left"
                      >
                        <span
                          className={`font-medium ${
                            filterTagId === tag.id
                              ? "text-blue-900"
                              : "text-black"
                          }`}
                        >
                          {tag.name}
                        </span>
                        <span
                          className={`ml-2 text-xs ${
                            filterTagId === tag.id
                              ? "text-blue-700"
                              : "text-black"
                          }`}
                        >
                          ({tag.noteCount})
                        </span>
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTag.mutate({ id: tag.id })}
                        disabled={deleteTag.isPending}
                      >
                        削除
                      </Button>
                    </div>
                  )
                )}
                {tags?.length === 0 && (
                  <p className="text-sm text-black">タグがありません</p>
                )}
              </div>
            </div>

            {/* エクスポート・インポート */}
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-black">
                データ管理
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-black">
                    エクスポート
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportJSON}
                    >
                      JSON
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportMarkdown}
                    >
                      Markdown
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportExcel}
                      className="bg-green-50 hover:bg-green-100"
                    >
                      📊 Excel
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-black">
                    インポート
                  </p>
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <Button size="sm" variant="outline" asChild>
                        <span>JSONファイル選択</span>
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>
                    <label className="cursor-pointer">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="bg-green-50 hover:bg-green-100"
                      >
                        <span>📊 Excelファイル選択</span>
                      </Button>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-black">
                    Excelテンプレート
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="bg-blue-50 hover:bg-blue-100"
                  >
                    📥 テンプレートをダウンロード
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
