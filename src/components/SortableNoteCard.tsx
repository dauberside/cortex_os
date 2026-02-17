import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteCard } from "./NoteCard";

interface SortableNoteCardProps {
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
  isDraggable: boolean;
  searchQuery?: string;
}

export function SortableNoteCard({
  note,
  displayNotes,
  onEdit,
  onDelete,
  isDraggable,
  searchQuery,
}: SortableNoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: note.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NoteCard
        note={note}
        displayNotes={displayNotes}
        onEdit={onEdit}
        onDelete={onDelete}
        searchQuery={searchQuery}
      />
    </div>
  );
}
