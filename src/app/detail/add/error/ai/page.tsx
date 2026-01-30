import { Suspense } from "react";
import EmotionNoteAddErrorAiRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddErrorAiRouteClient";

export default function EmotionNoteErrorAddAiPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddErrorAiRouteClient />
    </Suspense>
  );
}
