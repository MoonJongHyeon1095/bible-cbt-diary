import { Suspense } from "react";
import EmotionNoteAddErrorRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddErrorRouteClient";

export default function EmotionNoteErrorAddPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddErrorRouteClient />
    </Suspense>
  );
}
