import EmotionNoteDetailRouteClient from "@/components/emotion-notes/detail/EmotionNoteDetailRouteClient";
import { Suspense } from "react";

export default function EmotionNoteDetailRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteDetailRouteClient />
    </Suspense>
  );
}
