import { Suspense } from "react";
import EmotionNoteAddAlternativeRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddAlternativeRouteClient";

export default function EmotionNoteAlternativeAddPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddAlternativeRouteClient />
    </Suspense>
  );
}
