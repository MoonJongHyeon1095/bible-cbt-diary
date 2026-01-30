"use client";

import EmotionNoteAddModePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddModePage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteAddErrorRouteClient() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id") ?? "");
  if (Number.isNaN(noteId)) {
    return null;
  }

  return (
    <EmotionNoteAddModePage noteId={noteId} section="error" tone="rose" />
  );
}
