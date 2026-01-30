import { Suspense } from "react";
import EmotionNoteAddThoughtDirectRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddThoughtDirectRouteClient";

export default function EmotionNoteThoughtAddDirectPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddThoughtDirectRouteClient />
    </Suspense>
  );
}
