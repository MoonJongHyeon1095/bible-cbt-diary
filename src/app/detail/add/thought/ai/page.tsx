import { Suspense } from "react";
import EmotionNoteAddThoughtAiRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddThoughtAiRouteClient";

export default function EmotionNoteThoughtAddAiPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddThoughtAiRouteClient />
    </Suspense>
  );
}
