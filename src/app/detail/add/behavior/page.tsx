import { Suspense } from "react";
import EmotionNoteAddBehaviorRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddBehaviorRouteClient";

export default function EmotionNoteBehaviorAddPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddBehaviorRouteClient />
    </Suspense>
  );
}
