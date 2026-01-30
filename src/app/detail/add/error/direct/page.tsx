import { Suspense } from "react";
import EmotionNoteAddErrorDirectRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddErrorDirectRouteClient";

export default function EmotionNoteErrorAddDirectPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddErrorDirectRouteClient />
    </Suspense>
  );
}
