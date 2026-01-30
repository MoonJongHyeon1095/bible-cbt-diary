import { Suspense } from "react";
import EmotionNoteAddAlternativeDirectRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddAlternativeDirectRouteClient";

export default function EmotionNoteAlternativeAddDirectPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddAlternativeDirectRouteClient />
    </Suspense>
  );
}
