import { Suspense } from "react";
import EmotionNoteAddAlternativeAiRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddAlternativeAiRouteClient";

export default function EmotionNoteAlternativeAddAiPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddAlternativeAiRouteClient />
    </Suspense>
  );
}
