"use client";

import EmotionNoteAddThoughtPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddThoughtPage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteAddThoughtAiRouteClient() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id") ?? "");
  if (Number.isNaN(noteId)) {
    return null;
  }

  return <EmotionNoteAddThoughtPage noteId={noteId} mode="ai" />;
}
