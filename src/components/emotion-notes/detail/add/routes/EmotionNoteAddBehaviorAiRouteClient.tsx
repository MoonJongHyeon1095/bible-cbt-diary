"use client";

import EmotionNoteAddBehaviorPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddBehaviorPage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteAddBehaviorAiRouteClient() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id") ?? "");
  if (Number.isNaN(noteId)) {
    return null;
  }

  return <EmotionNoteAddBehaviorPage noteId={noteId} mode="ai" />;
}
