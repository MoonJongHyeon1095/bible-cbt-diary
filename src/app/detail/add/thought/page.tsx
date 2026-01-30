import { Suspense } from "react";
import EmotionNoteAddThoughtRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddThoughtRouteClient";

export default function EmotionNoteThoughtAddPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddThoughtRouteClient />
    </Suspense>
  );
}
