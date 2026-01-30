"use client";

import EmotionNoteAddModePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddModePage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteAddAlternativeRouteClient() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id") ?? "");
  if (Number.isNaN(noteId)) {
    return null;
  }

  return (
    <EmotionNoteAddModePage noteId={noteId} section="alternative" tone="green" />
  );
}
