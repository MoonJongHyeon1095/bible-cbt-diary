"use client";

import EmotionNoteAddErrorPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddErrorPage";
import { useSearchParams } from "next/navigation";

export default function EmotionNoteAddErrorDirectRouteClient() {
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("id") ?? "");
  if (Number.isNaN(noteId)) {
    return null;
  }

  return <EmotionNoteAddErrorPage noteId={noteId} mode="direct" />;
}
