import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { HighlightedText } from "./HighlightedText";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    updatedAt: Date;
  };
  displayNotes:
    | {
        id: string;
        title: string;
      }[]
    | undefined;
  onEdit: (note: { id: string; title: string; content: string }) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
}

export function NoteCard({
  note,
  displayNotes,
  onEdit,
  onDelete,
  searchQuery = "",
}: NoteCardProps) {
  const [selectedNoteForLink, setSelectedNoteForLink] = useState(false);
  const [linkTargetNoteId, setLinkTargetNoteId] = useState("");

  const utils = trpc.useUtils();
  const { data: links } = trpc.link.getByNote.useQuery({ noteId: note.id });

  const createLink = trpc.link.create.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      utils.link.getByNote.invalidate({ noteId: note.id });
      setLinkTargetNoteId("");
      setSelectedNoteForLink(false);
    },
  });

  const deleteLink = trpc.link.delete.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
      utils.link.getByNote.invalidate({ noteId: note.id });
    },
  });

  const deleteNote = trpc.note.delete.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate();
    },
  });

  return (
    <div className="rounded-lg bg-white p-4 shadow sm:p-6">
      <h3 className="mb-2 text-lg font-semibold text-black">
        {searchQuery ? (
          <HighlightedText text={note.title} query={searchQuery} />
        ) : (
          note.title
        )}
      </h3>
      <p className="mb-4 text-black">
        {searchQuery ? (
          <HighlightedText
            text={note.content}
            query={searchQuery}
            maxLength={200}
            showContext={true}
          />
        ) : (
          note.content
        )}
      </p>

      {/* リンクセクション */}
      {links && (links.outgoing.length > 0 || links.incoming.length > 0) && (
        <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
          {links.outgoing.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs font-semibold text-black">リンク先:</p>
              <div className="flex flex-wrap gap-1">
                {links.outgoing.map(
                  (link: { id: string; note: { title: string } }) => (
                    <div
                      key={link.id}
                      className="group flex items-center gap-1 rounded border border-gray-400 bg-white px-2 py-1 text-xs"
                    >
                      <span className="text-black">→ {link.note.title}</span>
                      <button
                        onClick={() => deleteLink.mutate({ id: link.id })}
                        className="text-black opacity-0 transition-opacity group-hover:opacity-100 hover:text-black"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {links.incoming.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-black">被リンク:</p>
              <div className="flex flex-wrap gap-1">
                {links.incoming.map(
                  (link: { id: string; note: { title: string } }) => (
                    <div
                      key={link.id}
                      className="group flex items-center gap-1 rounded border border-gray-400 bg-gray-200 px-2 py-1 text-xs"
                    >
                      <span className="text-black">← {link.note.title}</span>
                      <button
                        onClick={() => deleteLink.mutate({ id: link.id })}
                        className="text-black opacity-0 transition-opacity group-hover:opacity-100 hover:text-black"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(note)}>
          編集
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            onDelete(note.id);
            deleteNote.mutate({ id: note.id });
          }}
          disabled={deleteNote.isPending}
        >
          削除
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedNoteForLink(true)}
        >
          リンク追加
        </Button>
      </div>

      {/* リンク追加UI */}
      {selectedNoteForLink && (
        <div className="mt-3 rounded border border-gray-300 bg-gray-100 p-3">
          <p className="mb-2 text-sm font-medium text-black">
            リンク先ノートを選択:
          </p>
          <div className="flex gap-2">
            <select
              value={linkTargetNoteId}
              onChange={(e) => setLinkTargetNoteId(e.target.value)}
              className="flex-1 rounded border p-2 text-sm text-black"
            >
              <option value="">ノートを選択...</option>
              {displayNotes
                ?.filter((n: { id: string }) => n.id !== note.id)
                .map((n: { id: string; title: string }) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
            </select>
            <Button
              size="sm"
              onClick={() => {
                if (linkTargetNoteId) {
                  createLink.mutate({
                    fromNoteId: note.id,
                    toNoteId: linkTargetNoteId,
                  });
                }
              }}
              disabled={!linkTargetNoteId || createLink.isPending}
            >
              追加
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedNoteForLink(false);
                setLinkTargetNoteId("");
              }}
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-black">
        更新: {new Date(note.updatedAt).toLocaleString("ja-JP")}
      </p>
    </div>
  );
}
