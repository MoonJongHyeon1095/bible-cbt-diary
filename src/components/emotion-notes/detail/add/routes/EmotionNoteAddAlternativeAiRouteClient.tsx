"use client";

import EmotionNoteAddAlternativePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddAlternativePage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteAddAlternativeAiRouteClient() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id") ?? "");
  if (Number.isNaN(noteId)) {
    return null;
  }

  return <EmotionNoteAddAlternativePage noteId={noteId} mode="ai" />;
}
