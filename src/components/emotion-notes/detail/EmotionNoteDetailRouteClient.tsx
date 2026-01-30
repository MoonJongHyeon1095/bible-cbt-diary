"use client";

import EmotionNoteDetailPage from "@/components/emotion-notes/detail/EmotionNoteDetailPage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteDetailRouteClient() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const noteId = idParam ? Number(idParam) : null;
  const resolvedNoteId = noteId && !Number.isNaN(noteId) ? noteId : null;

  return <EmotionNoteDetailPage noteId={resolvedNoteId} />;
}
